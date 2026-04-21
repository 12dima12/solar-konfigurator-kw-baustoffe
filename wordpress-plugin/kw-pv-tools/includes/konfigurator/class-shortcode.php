<?php
namespace KW_PV_Tools\Konfigurator;

use KW_PV_Tools\Core\Assets;
use KW_PV_Tools\Core\CSP;
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
 *   privacy_url    optionaler Override; Default: get_privacy_policy_url()
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
            'privacy_url'    => '',
        ], $atts, self::TAG );

        $manufacturer = sanitize_key( $atts['manufacturer'] );
        $lang         = in_array( $atts['lang'], [ 'de', 'en', 'cs' ], true ) ? $atts['lang'] : 'de';
        $route        = in_array( $atts['route'], [ 'embed', 'configurator' ], true ) ? $atts['route'] : 'embed';

        // DSGVO Art. 13: der Datenschutz-Hinweis muss vor der Datenerhebung
        // sichtbar sein. Quelle-Priorität: Shortcode-Attribut → WP-Privacy-Page.
        $privacy_url_raw = is_string( $atts['privacy_url'] ) ? trim( $atts['privacy_url'] ) : '';
        $privacy_url     = $privacy_url_raw !== ''
            ? esc_url_raw( $privacy_url_raw )
            : (string) get_privacy_policy_url();

        // Next.js RSC emits inline <script> blocks (self.__next_f.push) for React
        // hydration. Allow 'unsafe-inline' in script-src on this page only.
        CSP::allow_inline();

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

        // Bootstrap-Daten für init.js vorbereiten
        $bootstrap = Assets::get_bootstrap_data();

        // Event-Bus + Init-Script einreihen (kein Inline-Script nötig)
        wp_enqueue_script( 'kw-pv-tools-event-bus' );
        wp_enqueue_script( 'kw-pv-tools-init' );

        ob_start();
        ?>
<div class="kw-pv-konfigurator-container"
     data-manufacturer="<?php echo esc_attr( $manufacturer ); ?>"
     data-lang="<?php echo esc_attr( $lang ); ?>"
     data-kw-api-base="<?php echo esc_attr( $bootstrap['apiBase'] ); ?>"
     data-kw-nonce="<?php echo esc_attr( $bootstrap['nonce'] ); ?>"
     data-kw-lang="<?php echo esc_attr( $bootstrap['lang'] ); ?>"
     data-kw-version="<?php echo esc_attr( $bootstrap['version'] ); ?>"
     <?php if ( $privacy_url ): ?>data-kw-privacy-url="<?php echo esc_attr( $privacy_url ); ?>"<?php endif; ?>
     <?php if ( $presets ): ?>data-kw-presets="<?php echo esc_attr( wp_json_encode( $presets ) ); ?>"<?php endif; ?>>

<?php foreach ( $assets['styles'] as $tag ) : ?>
<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput — pre-rendered <link> markup from the bundle, already built through DOMDocument::saveHTML ?>
<?php endforeach; ?>

<?php echo $assets['body']; // phpcs:ignore WordPress.Security.EscapeOutput — pre-rendered React HTML ?>

<?php foreach ( $assets['scripts'] as $tag ) : ?>
<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput — pre-rendered <script> markup from the bundle (preserves async/defer/type/integrity/crossorigin) ?>
<?php endforeach; ?>

</div>
        <?php
        return ob_get_clean();
    }
}
