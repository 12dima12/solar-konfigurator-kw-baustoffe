<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Asset-Loading für das React-Bundle aus Phase 9.
 *
 * Das Bundle liegt unter /assets/konfigurator/ und wurde von
 * `pnpm build` + sync-konfigurator.sh erzeugt.
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
     * Liest die HTML-Entry-Datei für manufacturer+route und extrahiert
     * alle <script src> und <link rel="stylesheet"> Tags plus den Body-Inhalt.
     *
     * Next.js erzeugt für jede Seite eine index.html mit allen Asset-Referenzen.
     * Wir parsen diese, um sie im WP-Kontext korrekt auszugeben.
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

        // <script src="..."> Tags extrahieren
        preg_match_all(
            '/<script[^>]+src=["\']([^"\']+)["\'][^>]*><\/script>/i',
            $html,
            $script_matches
        );

        // <link rel="stylesheet" href="..."> Tags extrahieren
        preg_match_all(
            '/<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*\/?>/i',
            $html,
            $style_matches
        );

        // Body-Inhalt extrahieren
        preg_match( '/<body[^>]*>(.*?)<\/body>/is', $html, $body_match );
        $body = $body_match[1] ?? '<div id="__next"></div>';

        // Asset-Pfade im Body umschreiben (Bilder, inline link/script):
        // Next.js rendert absolute Root-Pfade (/products/..., /_next/...),
        // die im WP-Kontext ohne Rewrite zu 404 führen.
        $body = self::rewrite_body_asset_paths( $body );

        return [
            'scripts' => array_map( [ __CLASS__, 'rewrite_asset_uri' ], $script_matches[1] ?? [] ),
            'styles'  => array_map( [ __CLASS__, 'rewrite_asset_uri' ], $style_matches[1] ?? [] ),
            'body'    => $body,
        ];
    }

    /**
     * Rewrites root-absolute asset paths in attribute values inside the body markup.
     * Covered attributes: src, href, srcset, poster, data-src.
     *
     * A root-absolute path starts with a single `/` and is NOT protocol-relative (`//`).
     * Only paths starting with `/_next/`, `/products/`, `/flags/` or other known
     * asset roots are rewritten — arbitrary site paths like `/impressum` stay intact.
     */
    private static function rewrite_body_asset_paths( string $body ): string {
        $asset_prefixes = [ '/_next/', '/products/', '/media/', '/flags/', '/favicon' ];

        // Match src="..." / href="..." / srcset="..." etc.
        $pattern = '/(\s(?:src|href|srcset|poster|data-src)=)(["\'])([^"\']+)\2/i';

        return preg_replace_callback( $pattern, function ( $m ) use ( $asset_prefixes ) {
            $attr  = $m[1];
            $quote = $m[2];
            $value = $m[3];

            // srcset can contain comma-separated URL+descriptor pairs
            if ( strpos( strtolower( $attr ), 'srcset' ) !== false ) {
                $parts = array_map( function ( $part ) use ( $asset_prefixes ) {
                    $part  = trim( $part );
                    $split = preg_split( '/\s+/', $part, 2 );
                    $url   = $split[0] ?? '';
                    $desc  = isset( $split[1] ) ? ' ' . $split[1] : '';
                    return self::maybe_rewrite_asset_path( $url, $asset_prefixes ) . $desc;
                }, explode( ',', $value ) );
                return $attr . $quote . implode( ', ', $parts ) . $quote;
            }

            return $attr . $quote . self::maybe_rewrite_asset_path( $value, $asset_prefixes ) . $quote;
        }, $body );
    }

    private static function maybe_rewrite_asset_path( string $url, array $asset_prefixes ): string {
        if ( $url === '' ) return $url;
        // Skip protocol-relative, absolute URLs, data-URIs, fragment, anchor
        if ( $url[0] !== '/' )           return $url;
        if ( isset( $url[1] ) && $url[1] === '/' ) return $url;

        foreach ( $asset_prefixes as $prefix ) {
            if ( strpos( $url, $prefix ) === 0 ) {
                return KW_PV_TOOLS_URL . 'assets/konfigurator' . $url;
            }
        }
        return $url;
    }

    /**
     * Next.js erzeugt absolute Pfade wie /_next/static/...
     * Diese werden auf den Plugin-Asset-URL umgeschrieben.
     */
    private static function rewrite_asset_uri( string $uri ): string {
        if ( strpos( $uri, '/_next/' ) === 0 ) {
            return KW_PV_TOOLS_URL . 'assets/konfigurator' . $uri;
        }
        // Relative Pfade (z.B. /products/...) → Plugin-Assets
        if ( strpos( $uri, '/' ) === 0 && strpos( $uri, '//' ) !== 0 ) {
            return KW_PV_TOOLS_URL . 'assets/konfigurator' . $uri;
        }
        return $uri;
    }

    /**
     * JavaScript-Globals für die React-App.
     * Muss vor dem App-Script-Tag geladen werden.
     */
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
