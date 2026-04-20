<?php
namespace KW_PV_Tools\Konfigurator;

use KW_PV_Tools\Core\Assets;
use KW_PV_Tools\Core\Settings;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Shortcode [kw_pv_konfigurator]
 *
 * Attribute:
 *   manufacturer   solax (default)
 *   route          embed | configurator (default: embed)
 *   lang           de | en | cs
 *   preset_kwp     float – Vorauswahl kWp (für Event-Bus / Phase 11)
 *   preset_battery float – Vorauswahl Batterie kWh
 *
 * Beispiel:
 *   [kw_pv_konfigurator manufacturer="solax" route="embed"]
 */
class Shortcode {

    const TAG = 'kw_pv_konfigurator';

    public static function register(): void {
        add_shortcode( self::TAG, [ __CLASS__, 'render' ] );
    }

    public static function render( $atts = [] ): string {
        $atts = shortcode_atts( [
            'manufacturer'   => 'solax',
            'route'          => 'embed',
            'lang'           => Settings::get( 'default_lang', 'de' ),
            'preset_kwp'     => '',
            'preset_battery' => '',
        ], $atts, self::TAG );

        $manufacturer = sanitize_key( $atts['manufacturer'] );
        $lang         = in_array( $atts['lang'], [ 'de', 'en', 'cs' ], true ) ? $atts['lang'] : 'de';
        $route        = in_array( $atts['route'], [ 'embed', 'configurator' ], true ) ? $atts['route'] : 'embed';

        $assets = Assets::extract_asset_tags( $manufacturer, $route );

        if ( isset( $assets['error'] ) ) {
            if ( current_user_can( 'manage_options' ) ) {
                return '<div class="kw-pv-tools-error" style="border:1px solid #c00;padding:12px;background:#fff8f8;">'
                    . '<strong>KW PV Tools:</strong> ' . esc_html( $assets['error'] ) . '</div>';
            }
            return '';
        }

        // Preset-Daten für Event-Bus (Phase 11)
        $presets = [];
        if ( is_numeric( $atts['preset_kwp'] ) )     $presets['kWp']        = (float) $atts['preset_kwp'];
        if ( is_numeric( $atts['preset_battery'] ) )  $presets['batteryKwh'] = (float) $atts['preset_battery'];

        // Event-Bus-Script sicherstellen
        wp_enqueue_script( 'kw-pv-tools-event-bus' );

        ob_start();
        ?>
<div class="kw-pv-konfigurator-container"
     data-manufacturer="<?php echo esc_attr( $manufacturer ); ?>"
     data-lang="<?php echo esc_attr( $lang ); ?>"
     <?php if ( $presets ): ?>data-presets="<?php echo esc_attr( wp_json_encode( $presets ) ); ?>"<?php endif; ?>>

<script><?php echo Assets::get_bootstrap_script(); // phpcs:ignore WordPress.Security.EscapeOutput ?></script>

<?php foreach ( $assets['styles'] as $href ) : ?>
<link rel="stylesheet" href="<?php echo esc_url( $href ); ?>">
<?php endforeach; ?>

<?php echo $assets['body']; // phpcs:ignore WordPress.Security.EscapeOutput — pre-rendered React HTML ?>

<?php foreach ( $assets['scripts'] as $src ) : ?>
<script src="<?php echo esc_url( $src ); ?>" defer></script>
<?php endforeach; ?>

<?php if ( $presets ) : ?>
<script>
window.addEventListener('kw-pv-tools:app-ready', function() {
    window.dispatchEvent(new CustomEvent('kw-pv-tools:preset', {
        detail: <?php echo wp_json_encode( $presets ); ?>
    }));
}, { once: true });
</script>
<?php endif; ?>

</div>
        <?php
        return ob_get_clean();
    }
}
