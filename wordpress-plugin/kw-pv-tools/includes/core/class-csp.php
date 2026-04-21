<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Content-Security-Policy für Frontend-Seiten mit dem Konfigurator-Shortcode.
 *
 * SCRIPT_HASHES: SHA-256-Hashes von Inline-<script>-Blöcken, die Next.js
 * möglicherweise in den Body injiziert (z.B. __NEXT_DATA__-Objekte).
 * Nach jedem `pnpm build` prüfen ob neue Inline-Scripts entstanden sind.
 *
 * Hash berechnen: printf '%s' "script-inhalt" | openssl dgst -sha256 -binary | base64
 *
 * WICHTIG: 'strict-dynamic' wird NICHT verwendet. Es würde 'self' in modernen
 * Browsern inoperativ machen und alle <script src> blockieren, sobald kein
 * Nonce/Hash die externen Scripts explizit whitelisted — App wäre komplett kaputt.
 * 'self' reicht: alle unsere Scripts sind externe Dateien von der eigenen Domain.
 */
class CSP {

    // SHA-256-Hashes von Inline-<script>-Blöcken aus dem Next.js-Bundle.
    // Leer = keine Inline-Scripts im Bundle (Normalfall nach unserer Refaktorierung).
    const SCRIPT_HASHES = [];

    // Gesetzt durch den Shortcode/Block wenn der Konfigurator auf der Seite gerendert wird.
    // Next.js RSC injiziert mehrere Inline-<script>-Blöcke (self.__next_f.push(...)) die
    // für die React-Hydration zwingend ausgeführt werden müssen. 'unsafe-inline' wird daher
    // nur auf Konfigurator-Seiten aktiviert, nicht global.
    private static bool $needs_inline = false;

    public static function allow_inline(): void {
        self::$needs_inline = true;
    }

    public static function register(): void {
        add_action( 'send_headers', [ __CLASS__, 'send_csp' ] );
    }

    public static function send_csp(): void {
        // Nur auf öffentlichen Seiten setzen — WP-Admin hat eigene Anforderungen.
        if ( is_admin() ) return;

        // Externe Scripts von der eigenen Domain erlauben.
        // Konfigurator-Seiten brauchen zusätzlich 'unsafe-inline' für Next.js RSC-Flight-Data.
        $script_src = "'self'";
        if ( self::$needs_inline ) {
            $script_src .= " 'unsafe-inline'";
        } elseif ( ! empty( self::SCRIPT_HASHES ) ) {
            $hashes     = implode( ' ', array_map( fn( $h ) => "'sha256-{$h}'", self::SCRIPT_HASHES ) );
            $script_src .= ' ' . $hashes;
        }

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
