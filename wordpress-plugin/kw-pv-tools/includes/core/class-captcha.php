<?php
namespace KW_PV_Tools\Core;

use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Captcha-System — Altcha-only.
 *
 * Nur zwei Modi: 'altcha' (Standard, self-hosted PoW) oder 'none' (Test/Intranet).
 * hCaptcha und reCAPTCHA v3 wurden in Batch A (v2.2.0) entfernt — beide Provider
 * sind externe Dienste mit Datenschutz-Implikationen und wären ohne CSP-Whitelisting
 * ihrer Origins im Frontend sowieso nicht lauffähig gewesen.
 * Siehe docs/DECISIONS.md ADR-004 (historisch) und ADR-008.
 *
 * Altcha benötigt: composer require altcha-org/altcha
 */
class Captcha {

    public static function get_provider(): string {
        return Settings::get_captcha_provider_effective();
    }

    public static function rest_get_config( WP_REST_Request $req ): WP_REST_Response {
        $provider = self::get_provider();
        $base     = rest_url( RestApi::NAMESPACE );
        $config   = [ 'provider' => $provider ];

        if ( $provider === 'altcha' ) {
            $config['challengeUrl'] = $base . '/captcha/altcha/challenge';
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
            case 'altcha': return self::verify_altcha( $token );
            case 'none':   return [ 'success' => true ];
            default:       return [ 'success' => false, 'reason' => 'unknown-provider' ];
        }
    }

    private static function verify_altcha( ?string $payload ): array {
        if ( ! $payload ) return [ 'success' => false, 'reason' => 'no-payload' ];

        $hmac = Settings::get( 'altcha_hmac_key' );
        if ( ! $hmac ) return [ 'success' => false, 'reason' => 'not-configured' ];

        if ( ! class_exists( 'AltchaOrg\\Altcha\\Altcha' ) ) {
            return [ 'success' => false, 'reason' => 'library-missing' ];
        }

        // Replay-Schutz: gelöste Token dürfen nur einmal verwendet werden.
        $fp = 'kw_pv_altcha_' . hash( 'sha256', $payload );
        if ( get_transient( $fp ) ) {
            return [ 'success' => false, 'reason' => 'replay' ];
        }

        try {
            $decoded = json_decode( base64_decode( $payload ), true );
            if ( ! is_array( $decoded ) ) return [ 'success' => false, 'reason' => 'parse-error' ];

            $ok = \AltchaOrg\Altcha\Altcha::verifySolution( $decoded, $hmac );
            if ( ! $ok ) return [ 'success' => false, 'reason' => 'verification-failed' ];

            // Token als "verbraucht" markieren (24h TTL — länger als jede Challenge-Gültigkeitsdauer)
            set_transient( $fp, 1, DAY_IN_SECONDS );
            return [ 'success' => true ];
        } catch ( \Throwable $e ) {
            return [ 'success' => false, 'reason' => 'exception: ' . $e->getMessage() ];
        }
    }
}
