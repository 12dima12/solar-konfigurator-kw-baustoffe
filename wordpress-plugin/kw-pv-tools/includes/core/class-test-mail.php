<?php
namespace KW_PV_Tools\Core;

use KW_PV_Tools\Konfigurator\SubmitHandler;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Test-Mail-Funktion: sendet eine Dummy-Submission an die konfigurierten Empfänger.
 */
class TestMail {

    const ACTION = 'kw_pv_tools_send_test_mail';

    public static function register(): void {
        add_action( 'admin_post_' . self::ACTION, [ __CLASS__, 'handle' ] );
    }

    public static function handle(): void {
        check_admin_referer( self::ACTION );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( __( 'Keine Berechtigung.', 'kw-pv-tools' ) );
        }

        $dummy = self::build_dummy_data();
        $ok    = self::send( $dummy );

        $redirect = add_query_arg(
            [ 'page' => Admin::PAGE_SLUG, 'kw_pv_test_mail' => $ok ? 'ok' : 'fail' ],
            admin_url( 'options-general.php' )
        );
        wp_safe_redirect( $redirect );
        exit;
    }

    private static function send( array $data ): bool {
        $recipients = Settings::get_sales_emails();
        if ( empty( $recipients ) ) {
            $recipients = [ get_option( 'admin_email' ) ];
        }

        $subject = sprintf( '[%s] Test-E-Mail KW PV Tools', $data['ticket'] );
        $html    = SubmitHandler::build_notification_html( $data );

        $all_ok = true;
        foreach ( $recipients as $email ) {
            if ( ! Mailer::send( $email, $subject, $html ) ) {
                $all_ok = false;
            }
        }
        return $all_ok;
    }

    private static function build_dummy_data(): array {
        return [
            'ticket'       => 'KW-PV-TEST-00000',
            'manufacturer' => 'solax',
            'lang'         => 'de',
            'contact'      => [
                'name'    => 'Max Mustermann (Test)',
                'email'   => get_option( 'admin_email' ),
                'phone'   => '+49 2387 123456',
                'message' => 'Dies ist eine Test-E-Mail vom KW PV Tools Plugin.',
            ],
            'selections'   => [
                [
                    'phase'           => 'inverter',
                    'steps'           => [ 'single-phase', '5kw' ],
                    'selectedProduct' => [
                        'product_code' => 'SLX-X1-5.0',
                        'product_name' => 'SolaX X1 Boost 5.0',
                        'value'        => '5,0 kW',
                    ],
                ],
                [
                    'phase'           => 'battery',
                    'steps'           => [ '10kwh' ],
                    'selectedProduct' => [
                        'product_code' => 'SLX-T58-100',
                        'product_name' => 'SolaX T-BAT H 5.8 × 2',
                        'value'        => '11,6 kWh',
                    ],
                ],
            ],
        ];
    }

    public static function render_button(): void {
        $action_url = wp_nonce_url(
            admin_url( 'admin-post.php?action=' . self::ACTION ),
            self::ACTION
        );
        $status = sanitize_key( $_GET['kw_pv_test_mail'] ?? '' );
        ?>
        <h2><?php _e( 'Test-E-Mail', 'kw-pv-tools' ); ?></h2>
        <p><?php _e( 'Sendet eine Dummy-Konfiguration an die konfigurierten Vertriebs-Empfänger.', 'kw-pv-tools' ); ?></p>
        <?php if ( $status === 'ok' ): ?>
            <div class="notice notice-success inline"><p><?php _e( 'Test-E-Mail erfolgreich gesendet.', 'kw-pv-tools' ); ?></p></div>
        <?php elseif ( $status === 'fail' ): ?>
            <div class="notice notice-error inline"><p><?php _e( 'Test-E-Mail konnte nicht gesendet werden. Bitte WP Mail SMTP prüfen.', 'kw-pv-tools' ); ?></p></div>
        <?php endif; ?>
        <a href="<?php echo esc_url( $action_url ); ?>" class="button button-secondary">
            <?php _e( 'Test-E-Mail senden', 'kw-pv-tools' ); ?>
        </a>
        <?php
    }
}
