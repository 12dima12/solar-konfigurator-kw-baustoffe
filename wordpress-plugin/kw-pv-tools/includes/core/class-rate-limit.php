<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * IP-basierter Rate-Limiter via WordPress-Transients.
 * Nutzt Object-Cache wenn verfügbar (Redis, Memcached), sonst Datenbank.
 */
class RateLimit {

    public static function check( string $key, int $limit, int $window_seconds ): array {
        $transient_key = 'kw_pv_tools_rl_' . md5( $key );
        $data          = get_transient( $transient_key );
        $now           = time();

        if ( ! $data || $data['reset_at'] < $now ) {
            $data = [ 'count' => 1, 'reset_at' => $now + $window_seconds ];
            set_transient( $transient_key, $data, $window_seconds );
            return [
                'allowed'   => true,
                'remaining' => $limit - 1,
                'reset_at'  => $data['reset_at'],
            ];
        }

        if ( $data['count'] >= $limit ) {
            return [
                'allowed'   => false,
                'remaining' => 0,
                'reset_at'  => $data['reset_at'],
            ];
        }

        $data['count']++;
        set_transient( $transient_key, $data, $data['reset_at'] - $now );

        return [
            'allowed'   => true,
            'remaining' => $limit - $data['count'],
            'reset_at'  => $data['reset_at'],
        ];
    }

    public static function get_client_ip(): string {
        $candidates = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED_FOR',
            'REMOTE_ADDR',
        ];

        foreach ( $candidates as $header ) {
            if ( ! empty( $_SERVER[ $header ] ) ) {
                $ip = explode( ',', $_SERVER[ $header ] )[0];
                $ip = trim( $ip );
                if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}
