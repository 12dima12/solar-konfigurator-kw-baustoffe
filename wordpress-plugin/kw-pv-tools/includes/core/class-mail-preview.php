<?php
namespace KW_PV_Tools\Core;

use KW_PV_Tools\Konfigurator\SubmitHandler;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * E-Mail-Vorschau-Seite: zeigt Benachrichtigungs- und Bestätigungsmail
 * in einem isolierten iFrame an.
 */
class MailPreview {

    const PAGE_SLUG   = 'kw-pv-tools-mail-preview';
    const IFRAME_ACTION = 'kw_pv_tools_mail_preview_frame';

    public static function register(): void {
        add_action( 'admin_menu',  [ __CLASS__, 'add_menu' ] );
        add_action( 'admin_init',  [ __CLASS__, 'maybe_output_frame' ] );
    }

    public static function add_menu(): void {
        add_submenu_page(
            'options-general.php',
            __( 'KW PV Tools – E-Mail-Vorschau', 'kw-pv-tools' ),
            __( 'PV-E-Mail-Vorschau', 'kw-pv-tools' ),
            'manage_options',
            self::PAGE_SLUG,
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) return;

        $type    = in_array( $_GET['type'] ?? 'notification', [ 'notification', 'confirmation' ], true )
            ? $_GET['type'] : 'notification';
        $nonce   = wp_create_nonce( self::IFRAME_ACTION );
        $base    = admin_url( 'options-general.php' );
        $notif_url = add_query_arg( [ 'page' => self::PAGE_SLUG, 'kw_pv_frame' => '1', 'type' => 'notification', '_wpnonce' => $nonce ], $base );
        $conf_url  = add_query_arg( [ 'page' => self::PAGE_SLUG, 'kw_pv_frame' => '1', 'type' => 'confirmation',  '_wpnonce' => $nonce ], $base );
        $iframe_url = add_query_arg( [ 'page' => self::PAGE_SLUG, 'kw_pv_frame' => '1', 'type' => $type, '_wpnonce' => $nonce ], $base );
        ?>
        <div class="wrap">
            <h1><?php _e( 'E-Mail-Vorschau', 'kw-pv-tools' ); ?></h1>
            <p>
                <a href="<?php echo esc_url( add_query_arg( 'type', 'notification', remove_query_arg( 'kw_pv_frame' ) ) ); ?>"
                   class="button <?php echo $type === 'notification' ? 'button-primary' : ''; ?>">
                    <?php _e( 'Benachrichtigung (Vertrieb)', 'kw-pv-tools' ); ?>
                </a>
                &nbsp;
                <a href="<?php echo esc_url( add_query_arg( 'type', 'confirmation', remove_query_arg( 'kw_pv_frame' ) ) ); ?>"
                   class="button <?php echo $type === 'confirmation' ? 'button-primary' : ''; ?>">
                    <?php _e( 'Bestätigung (Kunde)', 'kw-pv-tools' ); ?>
                </a>
            </p>
            <iframe src="<?php echo esc_url( $iframe_url ); ?>"
                    style="width:100%;height:600px;border:1px solid #ddd;border-radius:4px;background:#fff;"
                    sandbox="allow-same-origin">
            </iframe>
        </div>
        <?php
    }

    public static function maybe_output_frame(): void {
        if ( empty( $_GET['kw_pv_frame'] ) ) return;
        if ( ( $_GET['page'] ?? '' ) !== self::PAGE_SLUG ) return;
        if ( ! current_user_can( 'manage_options' ) ) return;
        if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], self::IFRAME_ACTION ) ) return;

        $type  = in_array( $_GET['type'] ?? '', [ 'notification', 'confirmation' ], true )
            ? $_GET['type'] : 'notification';
        $dummy = self::build_dummy();

        $html = $type === 'notification'
            ? SubmitHandler::build_notification_html( $dummy )
            : SubmitHandler::build_confirmation_html( $dummy );

        // Output bare HTML page (no WP wrapper)
        header( 'Content-Type: text/html; charset=utf-8' );
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>E-Mail-Vorschau</title></head><body style="margin:0;padding:16px;background:#f4f5f7;">';
        echo $html; // already escaped inside build_*_html
        echo '</body></html>';
        exit;
    }

    private static function build_dummy(): array {
        return [
            'ticket'       => 'KW-PV-' . date( 'Y' ) . '-00001',
            'manufacturer' => 'solax',
            'lang'         => 'de',
            'contact'      => [
                'name'    => 'Max Mustermann',
                'email'   => 'max.mustermann@example.de',
                'phone'   => '+49 2387 123456',
                'message' => 'Ich interessiere mich für eine PV-Anlage mit Speicher.',
            ],
            'selections'   => [
                [
                    'phase'           => 'inverter',
                    'steps'           => [ 'single-phase', '5kw' ],
                    'selectedProduct' => [
                        'product_name' => 'SolaX X1 Boost 5.0',
                        'value'        => '5,0 kW',
                    ],
                ],
                [
                    'phase'           => 'battery',
                    'steps'           => [ '10kwh' ],
                    'selectedProduct' => [
                        'product_name' => 'SolaX T-BAT H 5.8 × 2',
                        'value'        => '11,6 kWh',
                    ],
                ],
            ],
        ];
    }
}
