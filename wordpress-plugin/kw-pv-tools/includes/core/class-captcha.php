<?php
namespace KW_PV_Tools\Core;

use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Captcha-System (PHP-Portierung aus Phase 8).
 *
 * Provider per Settings wählbar. Default: altcha.
 * Altcha benötigt: composer require altcha-org/altcha
 */
class Captcha {

    public static function get_provider(): string {
        $provider = Settings::get( 'captcha_provider', 'altcha' );
        $valid    = [ 'altcha', 'hcaptcha', 'recaptcha', 'none' ];
        return in_array( $provider, $valid, true ) ? $provider : 'altcha';
    }

    public static function rest_get_config( WP_REST_Request $req ): WP_REST_Response {
        $provider = self::get_provider();
        $base     = rest_url( RestApi::NAMESPACE );
        $config   = [ 'provider' => $provider ];

        switch ( $provider ) {
            case 'altcha':
                $config['challengeUrl'] = $base . '/captcha/altcha/challenge';
                break;
            case 'hcaptcha':
                $config['siteKey'] = Settings::get( 'captcha_hcaptcha_sitekey', '' );
                break;
            case 'recaptcha':
                $config['siteKey'] = Settings::get( 'captcha_recaptcha_sitekey', '' );
                break;
        }

        return new WP_REST_Response( $config, 200 );
    }

    public static function rest_get_altcha_challenge( WP_REST_Request $req ): WP_REST_Response {
        if ( self::get_provider() !== 'altcha' ) {
            return new WP_REST_Response( [ 'error' => 'altcha not active' ], 400 );
        }

        $hmac       = Settings::get( 'altcha_hmac_key' );
        $complexity = (int) Settings::get( 'altcha_complexity', 100000 );

        if ( ! $hmac ) {
            return new WP_REST_Response( [ 'error' => 'altcha not configured' ], 500 );
        }

        if ( ! class_exists( 'AltchaOrg\\Altcha\\Altcha' ) ) {
            return new WP_REST_Response( [ 'error' => 'altcha library not installed (run composer install)' ], 500 );
        }

        try {
            $challenge = \AltchaOrg\Altcha\Altcha::createChallenge( [
                'hmacKey'   => $hmac,
                'maxNumber' => $complexity,
            ] );
            return new WP_REST_Response( $challenge, 200 );
        } catch ( \Throwable $e ) {
            return new WP_REST_Response( [ 'error' => 'challenge generation failed' ], 500 );
        }
    }

    /**
     * Serverseitige Captcha-Verifikation.
     * Wird vom SubmitHandler aufgerufen.
     *
     * @return array{ success: bool, reason?: string }
     */
    public static function verify( ?string $token ): array {
        switch ( self::get_provider() ) {
            case 'altcha':    return self::verify_altcha( $token );
            case 'hcaptcha':  return self::verify_hcaptcha( $token );
            case 'recaptcha': return self::verify_recaptcha( $token );
            case 'none':      return [ 'success' => true ];
            default:          return [ 'success' => false, 'reason' => 'unknown-provider' ];
        }
    }

    private static function verify_altcha( ?string $payload ): array {
        if ( ! $payload ) return [ 'success' => false, 'reason' => 'no-payload' ];

        $hmac = Settings::get( 'altcha_hmac_key' );
        if ( ! $hmac ) return [ 'success' => false, 'reason' => 'not-configured' ];

        if ( ! class_exists( 'AltchaOrg\\Altcha\\Altcha' ) ) {
            return [ 'success' => false, 'reason' => 'library-missing' ];
        }

        try {
            $decoded = json_decode( base64_decode( $payload ), true );
            if ( ! is_array( $decoded ) ) return [ 'success' => false, 'reason' => 'parse-error' ];

            $ok = \AltchaOrg\Altcha\Altcha::verifySolution( $decoded, $hmac );
            return $ok
                ? [ 'success' => true ]
                : [ 'success' => false, 'reason' => 'verification-failed' ];
        } catch ( \Throwable $e ) {
            return [ 'success' => false, 'reason' => 'exception: ' . $e->getMessage() ];
        }
    }

    private static function verify_hcaptcha( ?string $token ): array {
        if ( ! $token ) return [ 'success' => false, 'reason' => 'no-token' ];

        $secret = Settings::get( 'captcha_hcaptcha_secret', '' );
        if ( ! $secret ) return [ 'success' => false, 'reason' => 'no-secret' ];

        $res = wp_remote_post( 'https://hcaptcha.com/siteverify', [
            'body'    => [ 'secret' => $secret, 'response' => $token ],
            'timeout' => 5,
        ] );

        if ( is_wp_error( $res ) ) return [ 'success' => false, 'reason' => 'request-error' ];

        $data = json_decode( wp_remote_retrieve_body( $res ), true );
        return ( $data['success'] ?? false )
            ? [ 'success' => true ]
            : [ 'success' => false, 'reason' => implode( ',', $data['error-codes'] ?? [] ) ];
    }

    private static function verify_recaptcha( ?string $token ): array {
        if ( ! $token ) return [ 'success' => false, 'reason' => 'no-token' ];

        $secret = Settings::get( 'captcha_recaptcha_secret', '' );
        if ( ! $secret ) return [ 'success' => false, 'reason' => 'no-secret' ];

        $res = wp_remote_post( 'https://www.google.com/recaptcha/api/siteverify', [
            'body'    => [ 'secret' => $secret, 'response' => $token ],
            'timeout' => 5,
        ] );

        if ( is_wp_error( $res ) ) return [ 'success' => false, 'reason' => 'request-error' ];

        $data  = json_decode( wp_remote_retrieve_body( $res ), true );
        $score = (float) ( $data['score'] ?? 0 );

        if ( ! ( $data['success'] ?? false ) ) return [ 'success' => false, 'reason' => 'verification-failed' ];
        if ( $score < 0.5 ) return [ 'success' => false, 'reason' => 'low-score: ' . $score ];

        return [ 'success' => true, 'score' => $score ];
    }
}
