<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Checks for WP Mail SMTP and shows a dismissible admin notice if absent.
 */
class DependencyCheck {

    const DISMISS_OPTION = 'kw_pv_tools_smtp_notice_dismissed';

    public static function register(): void {
        add_action( 'admin_notices', [ __CLASS__, 'maybe_show_smtp_notice' ] );
        add_action( 'admin_post_kw_pv_tools_dismiss_smtp_notice', [ __CLASS__, 'handle_dismiss' ] );
    }

    public static function maybe_show_smtp_notice(): void {
        if ( ! current_user_can( 'manage_options' ) ) return;
        if ( get_option( self::DISMISS_OPTION ) ) return;
        if ( self::wp_mail_smtp_active() ) return;

        $dismiss_url = wp_nonce_url(
            admin_url( 'admin-post.php?action=kw_pv_tools_dismiss_smtp_notice' ),
            'kw_pv_tools_dismiss_smtp'
        );
        ?>
        <div class="notice notice-warning is-dismissible kw-pv-tools-smtp-notice">
            <p>
                <strong><?php _e( 'KW PV Tools:', 'kw-pv-tools' ); ?></strong>
                <?php _e(
                    'Für zuverlässigen E-Mail-Versand wird das Plugin <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="_blank">WP Mail SMTP</a> empfohlen. Es ist aktuell nicht aktiv.',
                    'kw-pv-tools'
                ); ?>
                &nbsp;<a href="<?php echo esc_url( $dismiss_url ); ?>"><?php _e( 'Nicht mehr anzeigen', 'kw-pv-tools' ); ?></a>
            </p>
        </div>
        <?php
    }

    public static function handle_dismiss(): void {
        check_admin_referer( 'kw_pv_tools_dismiss_smtp' );
        if ( current_user_can( 'manage_options' ) ) {
            update_option( self::DISMISS_OPTION, true );
        }
        wp_safe_redirect( wp_get_referer() ?: admin_url() );
        exit;
    }

    public static function wp_mail_smtp_active(): bool {
        if ( ! function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        return is_plugin_active( 'wp-mail-smtp/wp_mail_smtp.php' )
            || class_exists( '\WPMailSMTP\Core', false );
    }
}
