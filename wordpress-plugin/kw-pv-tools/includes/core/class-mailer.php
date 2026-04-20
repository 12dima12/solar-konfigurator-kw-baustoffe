<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * E-Mail-Versand via wp_mail().
 *
 * Empfehlung: WP Mail SMTP installieren, damit wp_mail() zuverlässig über
 * echten SMTP-Server versendet (statt PHP mail()).
 */
class Mailer {

    public static function send(
        string $to,
        string $subject,
        string $html_body,
        array $attachments = []
    ): bool {
        $from_email = Settings::get( 'from_email', get_option( 'admin_email' ) );
        $headers    = [
            'Content-Type: text/html; charset=UTF-8',
            sprintf( 'From: KW PV Solutions <%s>', $from_email ),
        ];

        return wp_mail( $to, $subject, $html_body, $headers, $attachments );
    }
}
