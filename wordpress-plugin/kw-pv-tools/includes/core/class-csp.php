<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Content-Security-Policy für Frontend-Seiten mit dem Konfigurator-Shortcode.
 *
 * Bekannte Einschränkung: Next.js Static Export injiziert möglicherweise
 * Inline-Scripts für Hydration (z.B. __NEXT_DATA__). Falls der Konfigurator
 * nach Deployment mit CSP-Fehler bricht, Hashes der betroffenen Inline-Scripts
 * berechnen und in SCRIPT_HASHES eintragen (nach jedem Bundle-Build prüfen).
 *
 * Hash berechnen: openssl dgst -sha256 -binary <<< "script-inhalt" | base64
 */
class CSP {

    // SHA-256-Hashes bekannter Next.js-Inline-Scripts.
    // Nach jedem Bundle-Build via `pnpm build` auf Aktualität prüfen.
    const SCRIPT_HASHES = [];

    public static function register(): void {
        add_action( 'send_headers', [ __CLASS__, 'send_csp' ] );
    }

    public static function send_csp(): void {
        // Nur auf öffentlichen Seiten setzen — WP-Admin hat eigene Anforderungen.
        if ( is_admin() ) return;

        $hashes     = implode( ' ', array_map(
            fn( $h ) => "'sha256-{$h}'",
            self::SCRIPT_HASHES
        ) );
        $hash_part  = $hashes ? ' ' . $hashes : '';

        // script-src ohne unsafe-inline/unsafe-eval.
        // 'strict-dynamic' erlaubt von whitelisted Scripts geladene Sub-Scripts.
        $script_src = "'self' 'strict-dynamic'" . $hash_part;

        $directives = [
            "default-src 'self'",
            "script-src {$script_src}",
            "style-src 'self' 'unsafe-inline'",   // Tailwind inline styles aus dem Bundle
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            // Erlaubt Einbettung nur von der eigenen Domain und kw-baustoffe.de
            "frame-ancestors 'self' https://www.kw-baustoffe.de https://kw-baustoffe.de",
        ];

        header( 'Content-Security-Policy: ' . implode( '; ', $directives ) );

        // Clickjacking-Schutz als Fallback für Browser ohne CSP frame-ancestors
        header( 'X-Frame-Options: SAMEORIGIN' );
        header( 'X-Content-Type-Options: nosniff' );
        header( 'Referrer-Policy: strict-origin-when-cross-origin' );
    }
}
