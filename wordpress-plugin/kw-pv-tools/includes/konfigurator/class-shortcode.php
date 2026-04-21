<?php
namespace KW_PV_Tools\Konfigurator;

use KW_PV_Tools\Core\CSP;
use KW_PV_Tools\Core\Settings;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Shortcode [kw_pv_konfigurator]
 *
 * Rendert den Konfigurator als iframe, der auf den statischen Next.js-Export
 * zeigt. Inline-Einbettung ist nicht möglich: Next.js hydratet via
 * hydrateRoot(document, …) den kompletten <html>/<body>, das lässt sich nicht
 * in einen WP-Page-Container stecken. Der iframe bekommt sein eigenes
 * Dokument und die App hydratet normal.
 *
 * Die Höhe wird dynamisch via postMessage vom Embed-Hook im Bundle
 * (useIframeResize) an den Parent gemeldet.
 *
 * Attribute:
 *   manufacturer   solax (default)
 *   lang           de | en | cs  (als URL-Parameter an den iframe)
 *   preset_kwp     float – Vorauswahl kWp
 *   preset_battery float – Vorauswahl Batterie kWh
 *   privacy_url    optionaler Override; Default: get_privacy_policy_url()
 *   height         CSS-Höhe des iframes bis die App die Höhe per postMessage
 *                  meldet — default 1200px
 */
class Shortcode {

    const TAG = 'kw_pv_konfigurator';

    public static function register(): void {
        add_shortcode( self::TAG, [ __CLASS__, 'render' ] );
    }

    public static function render( $atts = [] ): string {
        $atts = shortcode_atts( [
            'manufacturer'   => 'solax',
            'lang'           => Settings::get( 'default_lang', 'de' ),
            'preset_kwp'     => '',
            'preset_battery' => '',
            'privacy_url'    => '',
            'height'         => '1200px',
        ], $atts, self::TAG );

        $manufacturer = sanitize_key( $atts['manufacturer'] );
        $lang         = in_array( $atts['lang'], [ 'de', 'en', 'cs' ], true ) ? $atts['lang'] : 'de';

        $privacy_url_raw = is_string( $atts['privacy_url'] ) ? trim( $atts['privacy_url'] ) : '';
        $privacy_url     = $privacy_url_raw !== ''
            ? esc_url_raw( $privacy_url_raw )
            : (string) get_privacy_policy_url();

        $query = [ 'lang' => $lang ];
        if ( is_numeric( $atts['preset_kwp'] ) )     $query['kwp']     = (float) $atts['preset_kwp'];
        if ( is_numeric( $atts['preset_battery'] ) ) $query['battery'] = (float) $atts['preset_battery'];
        if ( $privacy_url !== '' )                    $query['privacy'] = $privacy_url;

        $iframe_path = 'assets/konfigurator/' . $manufacturer . '/embed/';
        $iframe_url  = KW_PV_TOOLS_URL . $iframe_path . '?' . http_build_query( $query );

        $iframe_id = 'kw-pv-iframe-' . wp_generate_uuid4();
        $height    = sanitize_text_field( $atts['height'] );

        // Das kleine Resize-Listener-Script ist inline eingebettet.
        CSP::allow_inline();

        ob_start();
        ?>
<div class="kw-pv-konfigurator-iframe-wrap">
<iframe
    id="<?php echo esc_attr( $iframe_id ); ?>"
    src="<?php echo esc_url( $iframe_url ); ?>"
    style="width:100%; border:0; display:block; height:<?php echo esc_attr( $height ); ?>;"
    loading="lazy"
    title="PV-Konfigurator"
    allow="clipboard-write"
></iframe>
<script>
(function(){
  var iframe = document.getElementById(<?php echo wp_json_encode( $iframe_id ); ?>);
  if (!iframe) return;
  var expected;
  try { expected = new URL(iframe.src).origin; } catch(e) { return; }
  window.addEventListener('message', function(e) {
    if (e.source !== iframe.contentWindow) return;
    if (e.origin !== expected) return;
    var d = e.data;
    if (d && d.type === 'kw-configurator-resize' && typeof d.height === 'number') {
      iframe.style.height = Math.max(600, Math.ceil(d.height)) + 'px';
    } else if (d && d.type === 'kw-configurator-scroll-to-top') {
      // Nach Auswahl: iframe-Top in den Viewport — der User hatte den
      // iframe womöglich weit nach unten gescrollt.
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
</script>
</div>
        <?php
        return ob_get_clean();
    }
}
