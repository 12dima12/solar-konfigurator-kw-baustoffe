<?php
namespace KW_PV_Tools\Core;

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
        // Captcha-Config
        register_rest_route( self::NAMESPACE, '/captcha/config', [
            'methods'             => 'GET',
            'callback'            => [ Captcha::class, 'rest_get_config' ],
            'permission_callback' => '__return_true',
        ] );

        // Altcha-Challenge
        register_rest_route( self::NAMESPACE, '/captcha/altcha/challenge', [
            'methods'             => 'GET',
            'callback'            => [ Captcha::class, 'rest_get_altcha_challenge' ],
            'permission_callback' => '__return_true',
        ] );

        // Submit
        register_rest_route( self::NAMESPACE, '/submit', [
            'methods'             => 'POST',
            'callback'            => [ 'KW_PV_Tools\\Konfigurator\\SubmitHandler', 'handle' ],
            'permission_callback' => '__return_true',
        ] );
    }
}
