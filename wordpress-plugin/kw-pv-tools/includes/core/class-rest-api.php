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
    }

    /**
     * CSRF-Schutz für POST /submit via Origin-Header-Validierung.
     *
     * Browser senden bei jedem Cross-Origin-POST den Origin-Header.
     * Same-Origin-Requests (App und WP auf gleicher Domain) senden ihn ebenfalls
     * (seit Fetch-Spec: immer bei non-GET/HEAD). Requests ohne Origin-Header
     * kommen aus Server-zu-Server-Calls, CLI oder Test-Tools — diese werden
     * durchgelassen, da sie kein browserseitiges CSRF-Risiko darstellen.
     */
    public static function submit_permission( WP_REST_Request $request ): bool {
        $origin = $request->get_header( 'origin' );

        // Kein Origin-Header → kein Browser-Cross-Origin-Request → erlauben
        if ( ! $origin ) return true;

        $allowed = array_unique( [
            rtrim( get_site_url(), '/' ),
            rtrim( home_url(), '/' ),
            'https://www.kw-baustoffe.de',
            'https://kw-baustoffe.de',
        ] );

        // In Dev-Umgebungen lokale Origins erlauben
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            array_push( $allowed, 'http://localhost:3000', 'http://localhost:8080' );
        }

        return in_array( rtrim( $origin, '/' ), $allowed, true );
    }
}
