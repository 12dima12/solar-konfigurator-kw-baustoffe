<?php
namespace KW_PV_Tools\Core;

use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Captcha-System — Altcha-only.
 *
 * Nur zwei Modi: 'altcha' (Standard, self-hosted PoW) oder 'none' (Test/Intranet).
 * hCaptcha und reCAPTCHA v3 wurden in Batch A (v2.2.0) entfernt.
 * Siehe docs/DECISIONS.md ADR-004 (historisch) und ADR-008.
 *
 * Altcha-Verifikation ist seit v2.5.1 inline implementiert (hash_hmac + hash,
 * PHP built-ins). Die externe altcha-org/altcha Composer-Dependency wurde entfernt,
 * weil v1.3.3+ PHP >=8.2 voraussetzt, das Plugin aber PHP 7.4 unterstützt.
 * Das Altcha-Protokoll (SHA-256 PoW + HMAC-Signatur) ist trivial genug, dass
 * kein Drittanbieter-Code nötig ist. Siehe ADR-015.
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

        $challenge = self::create_challenge( $hmac, $complexity );
        return new WP_REST_Response( $challenge, 200 );
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

    /**
     * Erstellt eine Altcha-Challenge ohne externe Library.
     *
     * Protokoll: challenge = sha256(salt + secretNumber), signature = hmac-sha256(key, challenge).
     * Der Client löst das PoW, indem er number = 0..maxNumber durchsucht bis
     * sha256(salt + number) === challenge.
     */
    private static function create_challenge( string $hmac_key, int $max_number ): array {
        $salt          = bin2hex( random_bytes( 12 ) );
        $secret_number = random_int( 0, $max_number );
        $challenge     = hash( 'sha256', $salt . $secret_number );
        $signature     = hash_hmac( 'sha256', $challenge, $hmac_key );

        return [
            'algorithm' => 'SHA-256',
            'challenge' => $challenge,
            'maxNumber' => $max_number,
            'salt'      => $salt,
            'signature' => $signature,
        ];
    }

    /**
     * Verifiziert eine Altcha-Lösung ohne externe Library.
     *
     * Schritte:
     *  1. HMAC-Signatur prüfen (Integrität — verhindert, dass der Client
     *     eine eigene Challenge einreicht).
     *  2. PoW prüfen: sha256(salt + number) muss gleich challenge sein.
     *
     * hash_equals() verhindert Timing-Angriffe.
     */
    private static function verify_altcha( ?string $payload ): array {
        if ( ! $payload ) return [ 'success' => false, 'reason' => 'no-payload' ];

        $hmac = Settings::get( 'altcha_hmac_key' );
        if ( ! $hmac ) return [ 'success' => false, 'reason' => 'not-configured' ];

        // Replay-Schutz: gelöste Token dürfen nur einmal verwendet werden.
        $fp = 'kw_pv_altcha_' . hash( 'sha256', $payload );
        if ( get_transient( $fp ) ) {
            return [ 'success' => false, 'reason' => 'replay' ];
        }

        $decoded = json_decode( base64_decode( $payload ), true );
        if ( ! is_array( $decoded ) ) return [ 'success' => false, 'reason' => 'parse-error' ];

        $algorithm = strtolower( str_replace( '-', '', $decoded['algorithm'] ?? '' ) );
        if ( $algorithm !== 'sha256' ) {
            return [ 'success' => false, 'reason' => 'unsupported-algorithm' ];
        }

        $challenge = (string) ( $decoded['challenge'] ?? '' );
        $salt      = (string) ( $decoded['salt']      ?? '' );
        $number    = (string) ( $decoded['number']    ?? '' );
        $signature = (string) ( $decoded['signature'] ?? '' );

        // 1. HMAC-Signatur validieren
        $expected_sig = hash_hmac( 'sha256', $challenge, $hmac );
        if ( ! hash_equals( $expected_sig, $signature ) ) {
            return [ 'success' => false, 'reason' => 'invalid-signature' ];
        }

        // 2. PoW validieren
        $expected_hash = hash( 'sha256', $salt . $number );
        if ( ! hash_equals( $expected_hash, $challenge ) ) {
            return [ 'success' => false, 'reason' => 'verification-failed' ];
        }

        // Token als "verbraucht" markieren (24h TTL)
        set_transient( $fp, 1, DAY_IN_SECONDS );
        return [ 'success' => true ];
    }
}
