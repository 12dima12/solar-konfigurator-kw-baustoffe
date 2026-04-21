<?php
namespace KW_PV_Tools\Konfigurator;

use KW_PV_Tools\Core\Settings;
use KW_PV_Tools\Core\Captcha;
use KW_PV_Tools\Core\RateLimit;
use KW_PV_Tools\Core\Mailer;
use KW_PV_Tools\Core\TicketId;
use KW_PV_Tools\Core\SubmissionsLog;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) exit;

class SubmitHandler {

    public static function handle( WP_REST_Request $req ): WP_REST_Response {
        // 1. Body parsen (Honeypot-Check braucht Rohdaten vor Validierung)
        $data = $req->get_json_params();
        if ( ! is_array( $data ) ) {
            return new WP_REST_Response( [ 'error' => 'Invalid body' ], 400 );
        }

        // 2. Honeypot — vor Rate-Limit: Bots verbrauchen keine Slots, erzeugen keine Tickets
        if ( ! empty( $data['website'] ) ) {
            return new WP_REST_Response( [ 'success' => true, 'id' => wp_generate_uuid4() ], 200 );
        }

        // 3. Rate-Limit
        $ip    = RateLimit::get_client_ip();
        $limit = (int) Settings::get( 'rate_limit_per_hour', 3 );
        $rl    = RateLimit::check( "submit:{$ip}", $limit, 3600 );

        if ( ! $rl['allowed'] ) {
            return new WP_REST_Response(
                [ 'error' => 'Too many submissions. Please try again later.' ],
                429
            );
        }

        // 4. Validierung
        $validated = self::validate( $data );
        if ( isset( $validated['error'] ) ) {
            return new WP_REST_Response( $validated, 400 );
        }

        // 5. Captcha — token must be a bounded string or null (never array/object)
        $captcha_token  = self::clean_captcha_token( $data['captchaToken'] ?? null );
        $captcha_result = Captcha::verify( $captcha_token );
        if ( ! $captcha_result['success'] ) {
            return new WP_REST_Response(
                [ 'error' => 'Captcha verification failed', 'reason' => $captcha_result['reason'] ?? '' ],
                403
            );
        }

        // 6. Ticket-ID generieren
        $ticket_id           = TicketId::generate();
        $validated['ticket'] = $ticket_id;

        // 7. Im Log speichern
        SubmissionsLog::save( $validated );

        // 8. Benachrichtigung an Vertrieb
        $notification_ok = self::send_notification( $validated );
        if ( ! $notification_ok ) {
            // Submission ist im Log gespeichert — kein 500 (würde Retry + Duplikat auslösen).
            // Admin muss Submissions-Log prüfen.
            error_log( sprintf(
                '[kw-pv-tools] Vertriebsmail fehlgeschlagen — Ticket %s, Empfänger: %s. Submission im Log vorhanden.',
                $ticket_id,
                implode( ', ', Settings::get_sales_emails() )
            ) );
        }

        // 9. Kundenbestätigung
        if ( ! empty( $validated['contact']['email'] ) ) {
            $confirmation_ok = self::send_confirmation( $validated );
            if ( ! $confirmation_ok ) {
                error_log( sprintf(
                    '[kw-pv-tools] Bestätigungsmail fehlgeschlagen — Ticket %s, Kunde: %s.',
                    $ticket_id,
                    $validated['contact']['email']
                ) );
            }
        }

        $response = [ 'success' => true, 'id' => $ticket_id ];
        if ( ! $notification_ok ) {
            // Internes Flag — nicht im Frontend anzeigen, aber für Monitoring nutzbar.
            $response['mail_status'] = 'notification_failed';
        }

        return new WP_REST_Response( $response, 200 );
    }

    // Hard upper bounds enforced on the server regardless of what the
    // frontend Zod schema claims. Values mirror src/components/configurator/
    // SubmitSummary.tsx but apply independently so tampering with the
    // client-side schema cannot sneak oversized strings past the backend.
    const MAX_NAME_LEN         = 100;
    const MAX_EMAIL_LEN        = 200;
    const MAX_PHONE_LEN        = 30;
    const MAX_MESSAGE_LEN      = 2000;
    const MAX_MANUFACTURER_LEN = 50;
    const MAX_PRODUCT_FIELD    = 200;
    const MAX_STEP_LEN         = 200;
    const MAX_STEPS_PER_PHASE  = 10;
    const MAX_SELECTIONS       = 20;
    const MAX_CAPTCHA_TOKEN    = 10000;

    private static function validate( array $data ): array {
        $errors = [];

        $manufacturer_raw = is_string( $data['manufacturer'] ?? null )
            ? self::cap( $data['manufacturer'], self::MAX_MANUFACTURER_LEN )
            : '';
        $manufacturer = sanitize_key( $manufacturer_raw );
        if ( ! $manufacturer ) $errors[] = 'manufacturer missing';

        $selections = $data['selections'] ?? [];
        if ( ! is_array( $selections ) || count( $selections ) === 0 ) $errors[] = 'no selections';
        if ( is_array( $selections ) && count( $selections ) > self::MAX_SELECTIONS ) $errors[] = 'too many selections';

        $contact  = is_array( $data['contact'] ?? null ) ? $data['contact'] : [];
        $name_raw  = is_string( $contact['name']  ?? null ) ? self::cap( $contact['name'],  self::MAX_NAME_LEN )  : '';
        $email_raw = is_string( $contact['email'] ?? null ) ? self::cap( $contact['email'], self::MAX_EMAIL_LEN ) : '';

        $name  = sanitize_text_field( $name_raw );
        $email = sanitize_email( $email_raw );
        if ( ! $name )                          $errors[] = 'name required';
        if ( ! $email || ! is_email( $email ) ) $errors[] = 'valid email required';

        if ( $errors ) return [ 'error' => 'validation', 'errors' => $errors ];

        $phone_raw   = is_string( $contact['phone']   ?? null ) ? self::cap( $contact['phone'],   self::MAX_PHONE_LEN )   : '';
        $message_raw = is_string( $contact['message'] ?? null ) ? self::cap( $contact['message'], self::MAX_MESSAGE_LEN ) : '';

        return [
            'manufacturer' => $manufacturer,
            'selections'   => self::sanitize_selections( $selections ),
            'contact'      => [
                'name'    => $name,
                'email'   => strtolower( $email ),
                'phone'   => sanitize_text_field( $phone_raw ),
                'message' => sanitize_textarea_field( $message_raw ),
            ],
            'lang' => in_array( $data['lang'] ?? '', [ 'de', 'en', 'cs' ], true ) ? $data['lang'] : 'de',
        ];
    }

    private static function sanitize_selections( array $selections ): array {
        $valid_phases = [ 'inverter', 'backup', 'battery', 'wallbox', 'accessory', 'finish' ];
        $out          = [];

        foreach ( $selections as $s ) {
            if ( ! is_array( $s ) ) continue;
            $phase = sanitize_key( $s['phase'] ?? '' );
            if ( ! in_array( $phase, $valid_phases, true ) ) continue;

            $product = null;
            if ( isset( $s['selectedProduct'] ) && is_array( $s['selectedProduct'] ) ) {
                $product = [
                    'product_code' => sanitize_text_field( self::cap( $s['selectedProduct']['product_code'] ?? '', self::MAX_PRODUCT_FIELD ) ),
                    'product_name' => sanitize_text_field( self::cap( $s['selectedProduct']['product_name'] ?? '', self::MAX_PRODUCT_FIELD ) ),
                    'value'        => sanitize_text_field( self::cap( $s['selectedProduct']['value']        ?? '', self::MAX_PRODUCT_FIELD ) ),
                ];
            }

            $steps_raw = is_array( $s['steps'] ?? null ) ? $s['steps'] : [];
            // Cap both the number of steps and each step's length
            $steps_capped = array_slice( $steps_raw, 0, self::MAX_STEPS_PER_PHASE );
            $steps_clean  = [];
            foreach ( $steps_capped as $step ) {
                if ( ! is_scalar( $step ) ) continue;
                $steps_clean[] = sanitize_text_field( self::cap( (string) $step, self::MAX_STEP_LEN ) );
            }

            $out[] = [
                'phase'           => $phase,
                'steps'           => $steps_clean,
                'selectedProduct' => $product,
            ];
        }

        return $out;
    }

    /**
     * Multibyte-aware truncation. Avoids mid-sequence cuts that would
     * corrupt UTF-8. Accepts non-strings silently to simplify callers.
     */
    private static function cap( $value, int $max ): string {
        if ( ! is_string( $value ) ) return '';
        // mb_substr ensures name fields with Umlauts / Czech diacritics /
        // emoji survive truncation without producing an invalid sequence.
        return function_exists( 'mb_substr' )
            ? mb_substr( $value, 0, $max )
            : substr( $value, 0, $max );
    }

    /**
     * Normalise captchaToken before handing it to Captcha::verify().
     * Ensures the value is a string (never an array/object that would
     * trigger a TypeError in the ?string parameter) and bounded in size.
     */
    private static function clean_captcha_token( $raw ): ?string {
        if ( ! is_string( $raw ) || $raw === '' ) return null;
        return self::cap( $raw, self::MAX_CAPTCHA_TOKEN );
    }

    private static function send_notification( array $data ): bool {
        $recipients = Settings::get_sales_emails();
        if ( empty( $recipients ) ) {
            $recipients = [ get_option( 'admin_email' ) ];
        }
        $subject = sprintf(
            '[%s] Neue PV-Konfiguration: %s (%s)',
            $data['ticket'] ?? '',
            $data['contact']['name'],
            date_i18n( 'd.m.Y' )
        );
        $html    = self::build_notification_html( $data );
        $all_ok  = true;
        foreach ( $recipients as $email ) {
            if ( ! Mailer::send( $email, $subject, $html ) ) {
                $all_ok = false;
            }
        }
        return $all_ok;
    }

    private static function send_confirmation( array $data ): bool {
        return Mailer::send(
            $data['contact']['email'],
            'Ihre PV-Konfiguration bei KW PV Solutions',
            self::build_confirmation_html( $data )
        );
    }

    /**
     * Renders the sales notification email HTML.
     * Public so TestMail and MailPreview can call it with dummy data.
     */
    public static function build_notification_html( array $data ): string {
        $name         = esc_html( $data['contact']['name'] );
        $email        = esc_html( $data['contact']['email'] );
        $phone        = esc_html( $data['contact']['phone'] );
        $message      = esc_html( $data['contact']['message'] );
        $manufacturer = esc_html( $data['manufacturer'] );
        $ticket       = esc_html( $data['ticket'] ?? '' );

        $rows = '';
        foreach ( $data['selections'] as $s ) {
            if ( ! isset( $s['selectedProduct'] ) ) continue;
            $p     = $s['selectedProduct'];
            $rows .= sprintf(
                '<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                    <strong>%s</strong><br>
                    <small style="color:#888;">#%s &bull; %s</small>
                </td></tr>',
                esc_html( $p['product_name'] ),
                esc_html( $p['product_code'] ),
                esc_html( $p['value'] )
            );
        }

        $phone_line   = $phone ? "<br>{$phone}" : '';
        $message_line = $message ? "<br><em>{$message}</em>" : '';

        return <<<HTML
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:20px;">Neue PV-Konfiguration</h1>
    <p style="color:#90b4d8;margin:4px 0 0;font-size:14px;">KW PV Solutions &bull; {$manufacturer} &bull; <strong style="color:#fff;">{$ticket}</strong></p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <h2 style="color:#1e3a5f;font-size:14px;margin-bottom:8px;">Kontakt</h2>
    <p><strong>{$name}</strong><br>{$email}{$phone_line}{$message_line}</p>
    <h2 style="color:#1e3a5f;font-size:14px;margin-top:20px;margin-bottom:8px;">Ausgewählte Komponenten</h2>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;">
      {$rows}
    </table>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">KW Baustoffe GmbH &bull; Drensteinfurt</p>
  </div>
</div>
HTML;
    }

    /**
     * Renders the customer confirmation email HTML.
     * Public so TestMail and MailPreview can call it with dummy data.
     */
    public static function build_confirmation_html( array $data ): string {
        $name   = esc_html( $data['contact']['name'] );
        $ticket = esc_html( $data['ticket'] ?? '' );
        $ticket_line = $ticket ? "<p style=\"color:#6b7280;font-size:13px;\">Ihre Referenznummer: <strong>{$ticket}</strong></p>" : '';

        return <<<HTML
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:20px;">Ihre PV-Konfiguration</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p>Sehr geehrte/r {$name},</p>
    <p>vielen Dank für Ihre Konfiguration. Wir haben Ihre Anfrage erhalten und melden uns
       in Kürze bei Ihnen.</p>
    {$ticket_line}
    <p>Mit freundlichen Grüßen,<br>
       <strong>KW PV Solutions</strong><br>
       KW Baustoffe GmbH &bull; Drensteinfurt</p>
  </div>
</div>
HTML;
    }
}
