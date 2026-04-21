<?php
/**
 * Plugin Name: Dev MailHog SMTP Redirect
 * Description: Routes every wp_mail() send to the MailHog container on
 *              mailhog:1025 so the smoke test can inspect sent mail at
 *              http://localhost:8025. Only loaded in the Docker dev
 *              environment (this file lives in wordpress-plugin/dev/mu-plugins).
 *
 * DO NOT DEPLOY this file to production — it hardwires the SMTP host
 * to "mailhog" and disables auth + TLS, which only makes sense inside
 * the dev compose network.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'phpmailer_init', function ( $phpmailer ) {
    $phpmailer->isSMTP();
    $phpmailer->Host        = 'mailhog';
    $phpmailer->Port        = 1025;
    $phpmailer->SMTPAuth    = false;
    $phpmailer->SMTPAutoTLS = false;
    $phpmailer->SMTPSecure  = '';
    // Sensible From default so MailHog's UI doesn't show "unknown sender"
    if ( empty( $phpmailer->From ) || $phpmailer->From === 'wordpress@localhost' ) {
        $phpmailer->From     = 'dev@kw-pv-tools.test';
        $phpmailer->FromName = 'KW PV Tools (dev)';
    }
} );

// Disable WP-Cron's "wp_mail failed" noise in the debug log when MailHog
// is briefly unavailable (e.g. during compose up).
add_action( 'wp_mail_failed', function ( $error ) {
    error_log( '[dev-mailhog] wp_mail failed: ' . $error->get_error_message() );
} );
