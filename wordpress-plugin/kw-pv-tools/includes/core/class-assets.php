<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Asset-Loading für das React-Bundle aus Phase 9.
 *
 * Das Bundle liegt unter /assets/konfigurator/ und wurde von
 * `pnpm build` + sync-konfigurator.sh erzeugt.
 *
 * Parsing-Strategie (seit D1): DOMDocument statt Regex.
 * Gründe:
 *   - Attribute wie `async`, `defer`, `type="module"`, `integrity`,
 *     `crossorigin`, `noModule` bleiben erhalten. Die alte Regex-Logik
 *     hat nur `src`/`href` extrahiert und beim Wiederausgeben die
 *     restlichen Attribute verworfen → falsche Ladereihenfolge und
 *     kaputte Module-Scripts nach dem Shortcode-Render.
 *   - Body-Asset-Rewrite basiert auf "existiert die Datei im Bundle?",
 *     nicht mehr auf einer Hardcoded-Prefix-Liste. So wird auch
 *     `/kw-logo.svg` (oder jedes andere File unter public/) erfasst,
 *     ohne den Prefix-Array nachpflegen zu müssen.
 *   - Kein Mid-Tag-Splitting bei geschachtelten Quotes in Attributen.
 */
class Assets {

    private static array $manifest_cache = [];

    public static function get_konfigurator_manifest(): array {
        if ( ! empty( self::$manifest_cache ) ) return self::$manifest_cache;

        $path = KW_PV_TOOLS_PATH . 'assets/konfigurator/kw-pv-tools-manifest.json';
        if ( ! file_exists( $path ) ) return [];

        $content              = file_get_contents( $path );
        self::$manifest_cache = json_decode( $content, true ) ?? [];
        return self::$manifest_cache;
    }

    /**
     * Parst die Next.js-Entry-HTML und trennt sie in drei Output-Blöcke:
     *   - styles  : komplette <link rel="stylesheet"> Tags
     *   - scripts : komplette <script src="..."> Tags
     *   - body    : Body-innerHTML, alle Asset-Attribute auf Plugin-URL umgeschrieben
     *
     * Inline-<script> (ohne src-Attribut) bleiben Teil des body; sie werden
     * nicht zu scripts[] extrahiert, weil sie gegen CSP::SCRIPT_HASHES
     * gehasht sein müssen.
     *
     * @return array{ scripts: string[], styles: string[], body: string }|array{ error: string }
     */
    public static function extract_asset_tags( string $manufacturer, string $route ): array {
        $entry_key = "{$manufacturer}-{$route}";
        $manifest  = self::get_konfigurator_manifest();

        if ( empty( $manifest ) ) {
            return [ 'error' => 'Manifest nicht gefunden. Bitte sync-konfigurator.sh ausführen.' ];
        }

        if ( ! isset( $manifest['entries'][ $entry_key ] ) ) {
            return [ 'error' => "Kein Eintrag für '{$entry_key}' im Manifest." ];
        }

        // Path-Traversal-Schutz: sicherstellen, dass der Manifest-Eintrag das
        // assets/konfigurator/-Verzeichnis nicht verlässt (z.B. ../../wp-config.php).
        $base_dir  = realpath( KW_PV_TOOLS_PATH . 'assets/konfigurator' );
        $html_path = realpath( KW_PV_TOOLS_PATH . 'assets/konfigurator/' . $manifest['entries'][ $entry_key ] );

        if ( ! $html_path || ! $base_dir || strpos( $html_path, $base_dir . DIRECTORY_SEPARATOR ) !== 0 ) {
            return [ 'error' => 'Ungültiger Manifest-Eintrag (path traversal attempt).' ];
        }

        $html = file_get_contents( $html_path );
        if ( $html === false || $html === '' ) {
            return [ 'error' => 'Entry-HTML ist leer.' ];
        }

        $doc = new \DOMDocument();
        // HTML5-Inhalt erzeugt Parser-Warnings (z.B. "Tag section invalid"),
        // die im Error-Log landen würden — wir fangen sie ab, der Parser
        // liefert trotzdem ein brauchbares DOM.
        $prev = libxml_use_internal_errors( true );
        // Der XML-Encoding-Prefix zwingt DOMDocument zu UTF-8; ohne den
        // würden Umlaute in Alt-Texten o.ä. als mojibake serialisiert.
        $loaded = $doc->loadHTML( '<?xml encoding="UTF-8">' . $html );
        libxml_clear_errors();
        libxml_use_internal_errors( $prev );

        if ( ! $loaded ) {
            return [ 'error' => 'Konnte Entry-HTML nicht parsen.' ];
        }

        $scripts = self::extract_script_tags( $doc );
        $styles  = self::extract_stylesheet_tags( $doc );

        $body_node = $doc->getElementsByTagName( 'body' )->item( 0 );
        if ( ! $body_node ) {
            return [ 'error' => 'Kein <body>-Tag im Entry-HTML gefunden.' ];
        }

        self::rewrite_body_assets( $body_node );
        $body = self::serialize_children( $doc, $body_node );

        return [
            'scripts' => $scripts,
            'styles'  => $styles,
            'body'    => $body,
        ];
    }

    /**
     * Sammelt alle <script src="..."> Tags im DOM (head und body).
     * Inline-Scripts (ohne src) werden übersprungen — sie bleiben im body.
     *
     * @return string[] komplette Script-Tags inkl. async/defer/type/integrity/…
     */
    private static function extract_script_tags( \DOMDocument $doc ): array {
        $out      = [];
        $elements = $doc->getElementsByTagName( 'script' );
        // DOMNodeList ist live — beim Löschen im Loop verschiebt sich der
        // Index. Snapshot in ein statisches Array bevor wir modifizieren.
        $snapshot = [];
        foreach ( $elements as $el ) $snapshot[] = $el;

        foreach ( $snapshot as $el ) {
            $src = $el->getAttribute( 'src' );
            if ( $src === '' ) continue;

            $el->setAttribute( 'src', self::rewrite_asset_uri( $src ) );
            $out[] = $doc->saveHTML( $el );
            // Aus dem body entfernen, damit Scripts nicht doppelt erscheinen
            // wenn Next.js welche direkt ins body injiziert hat.
            if ( $el->parentNode ) $el->parentNode->removeChild( $el );
        }
        return $out;
    }

    /**
     * Sammelt alle <link rel="stylesheet" href="..."> Tags.
     *
     * @return string[]
     */
    private static function extract_stylesheet_tags( \DOMDocument $doc ): array {
        $out      = [];
        $elements = $doc->getElementsByTagName( 'link' );
        $snapshot = [];
        foreach ( $elements as $el ) $snapshot[] = $el;

        foreach ( $snapshot as $el ) {
            if ( strtolower( $el->getAttribute( 'rel' ) ) !== 'stylesheet' ) continue;
            $href = $el->getAttribute( 'href' );
            if ( $href === '' ) continue;

            $el->setAttribute( 'href', self::rewrite_asset_uri( $href ) );
            $out[] = $doc->saveHTML( $el );
            if ( $el->parentNode ) $el->parentNode->removeChild( $el );
        }
        return $out;
    }

    /**
     * Walk body and rewrite every asset-bearing attribute. Covered:
     *   src, href, srcset, poster, data-src.
     */
    private static function rewrite_body_assets( \DOMNode $node ): void {
        if ( $node instanceof \DOMElement ) {
            foreach ( [ 'src', 'href', 'poster', 'data-src' ] as $attr ) {
                if ( ! $node->hasAttribute( $attr ) ) continue;
                $value      = $node->getAttribute( $attr );
                $rewritten  = self::rewrite_asset_uri_if_available( $value );
                if ( $rewritten !== $value ) $node->setAttribute( $attr, $rewritten );
            }
            if ( $node->hasAttribute( 'srcset' ) ) {
                $node->setAttribute( 'srcset', self::rewrite_srcset( $node->getAttribute( 'srcset' ) ) );
            }
        }

        foreach ( $node->childNodes as $child ) {
            self::rewrite_body_assets( $child );
        }
    }

    /**
     * Serialize a DOMElement's children back to HTML without the wrapping
     * element itself — equivalent to `element.innerHTML`.
     */
    private static function serialize_children( \DOMDocument $doc, \DOMElement $element ): string {
        $out = '';
        foreach ( $element->childNodes as $child ) {
            $out .= $doc->saveHTML( $child );
        }
        return $out;
    }

    /**
     * Rewrites the root-absolute URL of a bundle-owned asset (script/style
     * hrefs from Next.js — they are always under /_next/... and live in
     * the plugin's assets/konfigurator/ mirror). Non-absolute or external
     * URLs pass through unchanged.
     *
     * When built with NEXT_PUBLIC_ASSET_PREFIX, Next.js already embeds the
     * full plugin-relative path (e.g. /wp-content/plugins/kw-pv-tools/
     * assets/konfigurator/_next/…). In that case we must NOT double-prefix —
     * just turn the root-relative path into an absolute URL via home_url().
     */
    private static function rewrite_asset_uri( string $uri ): string {
        if ( $uri === '' )                               return $uri;
        if ( $uri[0] !== '/' )                           return $uri;
        if ( isset( $uri[1] ) && $uri[1] === '/' )       return $uri; // protocol-relative

        // assetPrefix case: path already contains the plugin directory.
        $plugin_rel = rtrim( (string) wp_parse_url( KW_PV_TOOLS_URL, PHP_URL_PATH ), '/' );
        if ( $plugin_rel !== '' && strpos( $uri, $plugin_rel . '/' ) === 0 ) {
            return rtrim( home_url(), '/' ) . $uri;
        }

        return KW_PV_TOOLS_URL . 'assets/konfigurator' . $uri;
    }

    /**
     * Rewrites a root-absolute URL only if the target exists inside
     * the plugin's assets/konfigurator/ folder. Leaves paths like
     * /impressum or /datenschutz alone — those point to real WP pages,
     * not bundle assets. Query string / fragment are stripped for the
     * filesystem lookup but preserved in the returned URL.
     */
    private static function rewrite_asset_uri_if_available( string $uri ): string {
        if ( $uri === '' )                               return $uri;
        if ( $uri[0] !== '/' )                           return $uri;
        if ( isset( $uri[1] ) && $uri[1] === '/' )       return $uri;

        $path_only = (string) strtok( $uri, '?#' );
        $fs_path   = KW_PV_TOOLS_PATH . 'assets/konfigurator' . $path_only;
        if ( ! is_file( $fs_path ) ) return $uri;

        return KW_PV_TOOLS_URL . 'assets/konfigurator' . $uri;
    }

    /**
     * srcset holds comma-separated "url descriptor" pairs.
     * Each URL is checked via rewrite_asset_uri_if_available individually.
     */
    private static function rewrite_srcset( string $value ): string {
        $parts = array_map( function ( $part ) {
            $part  = trim( $part );
            if ( $part === '' ) return $part;
            $split = preg_split( '/\s+/', $part, 2 );
            $url   = $split[0] ?? '';
            $desc  = isset( $split[1] ) ? ' ' . $split[1] : '';
            return self::rewrite_asset_uri_if_available( $url ) . $desc;
        }, explode( ',', $value ) );
        return implode( ', ', $parts );
    }

    /**
     * Returns bootstrap data as a plain array.
     * Consumed via data-* attributes on the container — no inline script needed.
     */
    public static function get_bootstrap_data(): array {
        $locale = get_locale();
        $lang   = $locale ? substr( $locale, 0, 2 ) : 'de';
        if ( ! in_array( $lang, [ 'de', 'en', 'cs' ], true ) ) $lang = 'de';

        return [
            'apiBase' => esc_url_raw( rest_url( 'kw-pv-tools/v1' ) ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
            'lang'    => $lang,
            'version' => KW_PV_TOOLS_VERSION,
        ];
    }
}
