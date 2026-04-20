<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * System health check page under WP-Admin → Einstellungen → KW PV Tools → System.
 */
class SystemCheck {

    const PAGE_SLUG = 'kw-pv-tools-system';

    public static function register(): void {
        add_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
    }

    public static function add_menu(): void {
        add_submenu_page(
            'options-general.php',
            __( 'KW PV Tools – System', 'kw-pv-tools' ),
            __( 'PV-System', 'kw-pv-tools' ),
            'manage_options',
            self::PAGE_SLUG,
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) return;

        $checks = self::run_checks();
        ?>
        <div class="wrap">
            <h1><?php _e( 'KW PV Tools – System-Check', 'kw-pv-tools' ); ?></h1>
            <p><?php _e( 'Überprüft alle Voraussetzungen für den reibungslosen Betrieb.', 'kw-pv-tools' ); ?></p>
            <table class="widefat striped" style="max-width:800px;">
                <thead>
                    <tr>
                        <th><?php _e( 'Prüfpunkt', 'kw-pv-tools' ); ?></th>
                        <th><?php _e( 'Status', 'kw-pv-tools' ); ?></th>
                        <th><?php _e( 'Details', 'kw-pv-tools' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $checks as $check ): ?>
                    <tr>
                        <td><strong><?php echo esc_html( $check['label'] ); ?></strong></td>
                        <td>
                            <?php if ( $check['ok'] ): ?>
                                <span style="color:#00a32a;">&#10003; <?php _e( 'OK', 'kw-pv-tools' ); ?></span>
                            <?php else: ?>
                                <span style="color:#d63638;">&#10007; <?php echo esc_html( $check['status'] ); ?></span>
                            <?php endif; ?>
                        </td>
                        <td style="color:#666;"><?php echo wp_kses_post( $check['detail'] ); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <p style="margin-top:16px;">
                <a href="<?php echo esc_url( admin_url( 'options-general.php?page=' . Admin::PAGE_SLUG ) ); ?>" class="button">
                    &larr; <?php _e( 'Zurück zu Einstellungen', 'kw-pv-tools' ); ?>
                </a>
            </p>
        </div>
        <?php
    }

    private static function run_checks(): array {
        $checks = [];

        // PHP version
        $php_ok = version_compare( PHP_VERSION, '7.4', '>=' );
        $checks[] = [
            'label'  => __( 'PHP-Version', 'kw-pv-tools' ),
            'ok'     => $php_ok,
            'status' => $php_ok ? 'OK' : __( 'Veraltet', 'kw-pv-tools' ),
            'detail' => 'PHP ' . PHP_VERSION . ' (mind. 7.4 erforderlich)',
        ];

        // WordPress version
        $wp_ok = version_compare( get_bloginfo( 'version' ), '6.0', '>=' );
        $checks[] = [
            'label'  => __( 'WordPress-Version', 'kw-pv-tools' ),
            'ok'     => $wp_ok,
            'status' => $wp_ok ? 'OK' : __( 'Veraltet', 'kw-pv-tools' ),
            'detail' => 'WordPress ' . get_bloginfo( 'version' ) . ' (mind. 6.0 erforderlich)',
        ];

        // Altcha library
        $altcha_ok = class_exists( 'AltchaOrg\\Altcha\\Altcha' );
        $checks[] = [
            'label'  => __( 'Altcha-Bibliothek', 'kw-pv-tools' ),
            'ok'     => $altcha_ok,
            'status' => $altcha_ok ? 'OK' : __( 'Fehlt', 'kw-pv-tools' ),
            'detail' => $altcha_ok
                ? __( 'altcha-org/altcha geladen', 'kw-pv-tools' )
                : __( '<code>composer install</code> im Plugin-Verzeichnis ausführen', 'kw-pv-tools' ),
        ];

        // WP Mail SMTP
        $smtp_ok = DependencyCheck::wp_mail_smtp_active();
        $checks[] = [
            'label'  => __( 'WP Mail SMTP', 'kw-pv-tools' ),
            'ok'     => $smtp_ok,
            'status' => $smtp_ok ? 'OK' : __( 'Nicht aktiv', 'kw-pv-tools' ),
            'detail' => $smtp_ok
                ? __( 'Plugin aktiv', 'kw-pv-tools' )
                : __( 'Empfohlen für zuverlässigen E-Mail-Versand. <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="_blank">Installieren</a>', 'kw-pv-tools' ),
        ];

        // Konfigurator-Bundle
        $manifest    = Assets::get_konfigurator_manifest();
        $manifest_ok = ! empty( $manifest );
        $checks[] = [
            'label'  => __( 'Konfigurator-Bundle', 'kw-pv-tools' ),
            'ok'     => $manifest_ok,
            'status' => $manifest_ok ? 'OK' : __( 'Fehlt', 'kw-pv-tools' ),
            'detail' => $manifest_ok
                ? sprintf( __( 'v%s, erzeugt %s', 'kw-pv-tools' ), esc_html( $manifest['version'] ?? '?' ), esc_html( $manifest['generatedAt'] ?? '?' ) )
                : __( '<code>sync-konfigurator.sh</code> ausführen', 'kw-pv-tools' ),
        ];

        // REST API reachable (check namespace is registered)
        $rest_ok = ! empty( rest_get_server()->get_routes( RestApi::NAMESPACE ) );
        $checks[] = [
            'label'  => __( 'REST-API', 'kw-pv-tools' ),
            'ok'     => $rest_ok,
            'status' => $rest_ok ? 'OK' : __( 'Nicht verfügbar', 'kw-pv-tools' ),
            'detail' => $rest_ok
                ? esc_url( rest_url( RestApi::NAMESPACE ) )
                : __( 'Routen nicht registriert', 'kw-pv-tools' ),
        ];

        // HMAC key set
        $hmac    = Settings::get( 'altcha_hmac_key', '' );
        $hmac_ok = strlen( $hmac ) >= 16;
        $checks[] = [
            'label'  => __( 'Altcha HMAC-Key', 'kw-pv-tools' ),
            'ok'     => $hmac_ok,
            'status' => $hmac_ok ? 'OK' : __( 'Nicht konfiguriert', 'kw-pv-tools' ),
            'detail' => $hmac_ok
                ? __( 'Key gesetzt (mind. 16 Zeichen)', 'kw-pv-tools' )
                : __( 'Unter Einstellungen → KW PV Tools einen HMAC-Key setzen', 'kw-pv-tools' ),
        ];

        // Sales email set
        $emails    = Settings::get_sales_emails();
        $email_ok  = ! empty( $emails );
        $checks[] = [
            'label'  => __( 'Vertriebs-E-Mail', 'kw-pv-tools' ),
            'ok'     => $email_ok,
            'status' => $email_ok ? 'OK' : __( 'Nicht konfiguriert', 'kw-pv-tools' ),
            'detail' => $email_ok
                ? esc_html( implode( ', ', $emails ) )
                : __( 'Unter Einstellungen → KW PV Tools eine E-Mail-Adresse eingeben', 'kw-pv-tools' ),
        ];

        // WP-Cron
        $cron_ok = ! defined( 'DISABLE_WP_CRON' ) || ! DISABLE_WP_CRON;
        $checks[] = [
            'label'  => __( 'WP-Cron', 'kw-pv-tools' ),
            'ok'     => $cron_ok,
            'status' => $cron_ok ? 'OK' : __( 'Deaktiviert', 'kw-pv-tools' ),
            'detail' => $cron_ok
                ? __( 'Für automatische Bereinigung des Submission-Logs aktiv', 'kw-pv-tools' )
                : __( 'DISABLE_WP_CRON ist gesetzt — Bereinigung manuell einrichten', 'kw-pv-tools' ),
        ];

        return $checks;
    }
}
