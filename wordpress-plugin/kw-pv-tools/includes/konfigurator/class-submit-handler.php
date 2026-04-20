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
        // 1. Rate-Limit
        $ip    = RateLimit::get_client_ip();
        $limit = (int) Settings::get( 'rate_limit_per_hour', 3 );
        $rl    = RateLimit::check( "submit:{$ip}", $limit, 3600 );

        if ( ! $rl['allowed'] ) {
            return new WP_REST_Response(
                [ 'error' => 'Too many submissions. Please try again later.' ],
                429
            );
        }

        // 2. Body parsen & validieren
        $data = $req->get_json_params();
        if ( ! is_array( $data ) ) {
            return new WP_REST_Response( [ 'error' => 'Invalid body' ], 400 );
        }

        $validated = self::validate( $data );
        if ( isset( $validated['error'] ) ) {
            return new WP_REST_Response( $validated, 400 );
        }

        // 3. Honeypot (silent accept)
        if ( ! empty( $data['website'] ) ) {
            return new WP_REST_Response( [ 'success' => true, 'id' => wp_generate_uuid4() ], 200 );
        }

        // 4. Captcha
        $captcha_result = Captcha::verify( $data['captchaToken'] ?? null );
        if ( ! $captcha_result['success'] ) {
            return new WP_REST_Response(
                [ 'error' => 'Captcha verification failed', 'reason' => $captcha_result['reason'] ?? '' ],
                403
            );
        }

        // 5. Ticket-ID generieren
        $ticket_id           = TicketId::generate();
        $validated['ticket'] = $ticket_id;

        // 6. Im Log speichern
        SubmissionsLog::save( $validated );

        // 7. Benachrichtigung an Vertrieb
        $sent = self::send_notification( $validated );
        if ( ! $sent ) {
            error_log( '[kw-pv-tools] wp_mail() failed for ticket ' . $ticket_id );
        }

        // 8. Kundenbestätigung
        if ( ! empty( $validated['contact']['email'] ) ) {
            self::send_confirmation( $validated );
        }

        return new WP_REST_Response(
            [ 'success' => true, 'id' => $ticket_id ],
            200
        );
    }

    private static function validate( array $data ): array {
        $errors = [];

        $manufacturer = sanitize_key( $data['manufacturer'] ?? '' );
        if ( ! $manufacturer ) $errors[] = 'manufacturer missing';

        $selections = $data['selections'] ?? [];
        if ( ! is_array( $selections ) || count( $selections ) === 0 ) $errors[] = 'no selections';
        if ( count( $selections ) > 20 ) $errors[] = 'too many selections';

        $contact = $data['contact'] ?? [];
        $name    = sanitize_text_field( $contact['name'] ?? '' );
        $email   = sanitize_email( $contact['email'] ?? '' );
        if ( ! $name )                         $errors[] = 'name required';
        if ( ! $email || ! is_email( $email ) ) $errors[] = 'valid email required';

        if ( $errors ) return [ 'error' => 'validation', 'errors' => $errors ];

        return [
            'manufacturer' => $manufacturer,
            'selections'   => self::sanitize_selections( $selections ),
            'contact'      => [
                'name'    => $name,
                'email'   => strtolower( $email ),
                'phone'   => sanitize_text_field( $contact['phone'] ?? '' ),
                'message' => sanitize_textarea_field( substr( $contact['message'] ?? '', 0, 2000 ) ),
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
                    'product_code' => sanitize_text_field( $s['selectedProduct']['product_code'] ?? '' ),
                    'product_name' => sanitize_text_field( $s['selectedProduct']['product_name'] ?? '' ),
                    'value'        => sanitize_text_field( $s['selectedProduct']['value'] ?? '' ),
                ];
            }

            $out[] = [
                'phase'           => $phase,
                'steps'           => array_map( 'sanitize_text_field', (array) ( $s['steps'] ?? [] ) ),
                'selectedProduct' => $product,
            ];
        }

        return $out;
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
