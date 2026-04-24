<?php
namespace KW_PV_Tools\Core;

use KW_PV_Tools\Konfigurator\Block;
use KW_PV_Tools\Konfigurator\Shortcode;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Content-Security-Policy für Frontend-Seiten mit dem Konfigurator-Shortcode.
 *
 * Hook-Timing (wichtig für das Opt-In):
 *   init → send_headers → query_posts → wp → template_redirect → the_content
 *                                        ↑ CSP-Header            ↑ Shortcode rendert
 *
 * Die CSP wird beim `wp`-Action geschrieben — nach query_posts(), aber vor
 * jeglichem Template-Output. get_queried_object() ist dort korrekt befüllt,
 * so dass has_shortcode/has_block den Post-Content prüfen können.
 * (send_headers feuert VOR query_posts → get_queried_object() = null dort.)
 *
 * SCRIPT_HASHES: leer, solange Konfigurator-Seiten 'unsafe-inline' nutzen.
 * Next.js RSC emittiert mehrere `self.__next_f.push(...)` Inline-Blöcke
 * für die React-Hydration — ohne deren Ausführung wird der Tree statisch
 * gerendert, aber Event-Handler werden nie attached (Buttons tot).
 * Hash-basierter Pfad ist in Batch F geplant: post-export.mjs berechnet
 * die Hashes zur Build-Zeit und schreibt sie in eine JSON, die diese
 * Klasse zur Laufzeit liest.
 */
class CSP {

    const SCRIPT_HASHES = [];

    /**
     * Beibehalten als explizites Opt-In für Fälle, in denen der Shortcode
     * nicht im post_content liegt (z.B. `do_shortcode()` in einem Theme-
     * Template). Solche Aufrufer müssen allow_inline() VOR send_headers
     * aufrufen — realistisch auf `init` oder sehr früh im Template.
     */
    private static bool $needs_inline = false;

    public static function allow_inline(): void {
        self::$needs_inline = true;
    }

    public static function register(): void {
        // 'wp' fires after WP::query_posts() so get_queried_object() is populated.
        // 'send_headers' fires before the DB query — get_queried_object() returns
        // null there, causing has_shortcode() to miss the konfigurator page.
        // header() calls work fine here: no template output has started yet.
        add_action( 'wp', [ __CLASS__, 'send_csp' ] );
    }

    public static function send_csp(): void {
        if ( is_admin() ) return;

        // Die CSP ist NUR für die Konfigurator-Seite relevant — auf allen
        // anderen Seiten würde sie das Theme beschädigen (inline-JS für
        // Mobile-Menu-Toggles, Analytics-Snippets, etc. werden durch
        // `script-src 'self'` hart blockiert, ohne dass der Nutzer die
        // Ursache sieht). Wenn die aktuelle Seite den Konfigurator nicht
        // einbettet, geben wir den CSP-Header NICHT aus und das Theme läuft
        // unverändert.
        $is_konfigurator_page = self::$needs_inline || self::current_page_has_konfigurator();
        if ( ! $is_konfigurator_page ) return;

        $script_src = "'self' 'unsafe-inline'";

        $directives = [
            "default-src 'self'",
            "script-src {$script_src}",
            "style-src 'self' 'unsafe-inline'",
            // https: für Gravatar (Admin-Bar eingeloggter User). Kein CDN-Upload-Kanal —
            // CSP erlaubt hier nur lesenden Fetch, kein Script-Exec.
            "img-src 'self' https: data: blob:",
            // data: für Next.js icon fonts (inline base64 WOFF2 im Bundle).
            "font-src 'self' data:",
            "connect-src 'self'",
            "worker-src 'self' blob:",
            // 'self' damit der Konfigurator-iframe (gleicher Host) laden darf.
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self' https://www.kw-baustoffe.de https://kw-baustoffe.de",
        ];

        header( 'Content-Security-Policy: ' . implode( '; ', $directives ) );

        header( 'X-Frame-Options: SAMEORIGIN' );
        header( 'X-Content-Type-Options: nosniff' );
        header( 'Referrer-Policy: strict-origin-when-cross-origin' );
    }

    /**
     * True wenn die aktuelle Haupt-Seite den Konfigurator-Shortcode oder
     * -Block enthält. Wird während `send_headers` aufgerufen — dort ist
     * die Main-Query bereits ausgeführt und get_queried_object() liefert
     * den WP_Post.
     *
     * Deckt nicht ab:
     *   - Shortcode via `do_shortcode()` aus einem Theme-Template;
     *     post_content ist leer oder irrelevant. Dafür muss das Theme
     *     CSP::allow_inline() explizit auf einem frühen Hook (z.B. `init`)
     *     aufrufen.
     *   - Nicht-Main-Query-Seiten (Archive, Suche), wo get_queried_object()
     *     kein WP_Post ist. Der Konfigurator-Shortcode gehört nicht auf
     *     solche Seiten, daher akzeptiert.
     */
    private static function current_page_has_konfigurator(): bool {
        $post = get_queried_object();
        if ( ! $post instanceof \WP_Post ) return false;

        $content = (string) $post->post_content;
        if ( $content === '' ) return false;

        if ( has_shortcode( $content, Shortcode::TAG ) ) return true;
        if ( function_exists( 'has_block' ) && has_block( Block::BLOCK_NAME, $post ) ) return true;

        return false;
    }
}
