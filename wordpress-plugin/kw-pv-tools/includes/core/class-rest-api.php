<?php
namespace KW_PV_Tools\Core;

use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Registriert alle REST-Routen unter /wp-json/kw-pv-tools/v1/*.
 */
class RestApi {

    const NAMESPACE = 'kw-pv-tools/v1';

    public static function register(): void {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function register_routes(): void {
        // Captcha-Config (öffentliches GET — kein CSRF-Risiko)
        register_rest_route( self::NAMESPACE, '/captcha/config', [
            'methods'             => 'GET',
            'callback'            => [ Captcha::class, 'rest_get_config' ],
            'permission_callback' => '__return_true',
        ] );

        // Altcha-Challenge (öffentliches GET — kein CSRF-Risiko)
        register_rest_route( self::NAMESPACE, '/captcha/altcha/challenge', [
            'methods'             => 'GET',
            'callback'            => [ Captcha::class, 'rest_get_altcha_challenge' ],
            'permission_callback' => '__return_true',
        ] );

        // Submit — Origin-Check als CSRF-Schutz
        register_rest_route( self::NAMESPACE, '/submit', [
            'methods'             => 'POST',
            'callback'            => [ 'KW_PV_Tools\\Konfigurator\\SubmitHandler', 'handle' ],
            'permission_callback' => [ __CLASS__, 'submit_permission' ],
        ] );

        // Configuration PDF — streamt das PDF für den "Drucken"-Button ohne
        // Kontaktdaten. Kein Captcha, aber per-IP-Rate-Limit + Origin-Check:
        // der Endpoint verarbeitet keine Lead-Daten, das einzige Missbrauchs-
        // risiko ist CPU-Last durch wiederholte mpdf-Rendering-Aufrufe.
        register_rest_route( self::NAMESPACE, '/configurator/pdf', [
            'methods'             => 'POST',
            'callback'            => [ 'KW_PV_Tools\\Konfigurator\\PdfEndpoint', 'handle' ],
            'permission_callback' => [ __CLASS__, 'submit_permission' ],
        ] );
    }

    /**
     * CSRF-Schutz für POST /submit via Origin-/Referer-Header-Validierung.
     *
     * Alle modernen Browser senden bei POST-Requests entweder einen Origin-
     * oder einen Referer-Header. Fetch-Spec (2022+) garantiert Origin für
     * non-GET/HEAD bei CORS-Requests; `referrerPolicy: "strict-origin..."`
     * (Next.js Default) garantiert zusätzlich einen Referer.
     *
     * Requests *ohne* beide Header sind per Definition kein Browser-Traffic —
     * typischerweise CLI-Tools (curl, wget) oder server-to-server-Scripts.
     * Solche Requests werden hier blockiert; Ausnahme: WP_DEBUG-Modus für
     * lokale Entwicklung und automatisierte Tests.
     *
     * Accepted origins: `get_site_url()`, `home_url()`, sowie die
     * `kw-baustoffe.de`-Domains (mit und ohne `www.`).
     */
    public static function submit_permission( WP_REST_Request $request ): bool {
        $allowed = self::allowed_origins();
        $origin  = $request->get_header( 'origin' );

        if ( $origin !== null && $origin !== '' ) {
            return in_array( rtrim( $origin, '/' ), $allowed, true );
        }

        // Kein Origin-Header → Referer-Fallback prüfen.
        $referer = $request->get_header( 'referer' );
        if ( $referer ) {
            $referer_origin = self::origin_from_url( $referer );
            if ( $referer_origin && in_array( $referer_origin, $allowed, true ) ) {
                return true;
            }
        }

        // Weder Origin noch gültiger Referer → nur in Dev-Umgebungen zulassen,
        // damit curl-basierte Tests und CI-Smoke-Checks weiter funktionieren.
        return self::is_debug();
    }

    private static function allowed_origins(): array {
        $list = array_unique( [
            rtrim( get_site_url(), '/' ),
            rtrim( home_url(), '/' ),
            'https://www.kw-baustoffe.de',
            'https://kw-baustoffe.de',
        ] );

        if ( self::is_debug() ) {
            $list[] = 'http://localhost:3000';
            $list[] = 'http://localhost:8080';
        }

        return array_values( array_filter( $list ) );
    }

    private static function origin_from_url( string $url ): ?string {
        $parts = wp_parse_url( $url );
        if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) ) return null;

        $origin = $parts['scheme'] . '://' . $parts['host'];
        if ( ! empty( $parts['port'] ) ) {
            $origin .= ':' . (int) $parts['port'];
        }
        return $origin;
    }

    private static function is_debug(): bool {
        return defined( 'WP_DEBUG' ) && WP_DEBUG;
    }
}
