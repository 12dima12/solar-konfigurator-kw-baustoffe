<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * IP-basierter Rate-Limiter mit atomarem MySQL-Locking.
 *
 * Speichert Zähler direkt in wp_options (kein Transient-API) und verwendet
 * SELECT … FOR UPDATE in einer Transaktion, um TOCTOU-Races unter PHP-FPM
 * mit mehreren Worker-Prozessen zu eliminieren.
 *
 * Cleanup: stale Einträge werden über den täglichen Purge-Cron entfernt.
 * Bei Deaktivierung: RateLimit::cleanup() löscht alle kw_pv_rl_*-Einträge.
 */
class RateLimit {

    const OPT_PREFIX = 'kw_pv_rl_';

    public static function check( string $key, int $limit, int $window_seconds ): array {
        global $wpdb;

        $opt_key = self::OPT_PREFIX . md5( $key );
        $now     = time();

        // Atomares Read-Modify-Write: FOR UPDATE sperrt die Zeile bis COMMIT/ROLLBACK.
        // Kein zweiter Worker kann gleichzeitig denselben Zähler lesen + schreiben.
        $wpdb->query( 'START TRANSACTION' );

        $raw = $wpdb->get_var( $wpdb->prepare(
            "SELECT option_value FROM {$wpdb->options}
             WHERE option_name = %s FOR UPDATE",
            $opt_key
        ) );

        if ( $raw === null ) {
            // Erste Anfrage für diesen Key — neue Zeile anlegen
            $entry = [ 'count' => 1, 'reset_at' => $now + $window_seconds ];
            $wpdb->insert( $wpdb->options, [
                'option_name'  => $opt_key,
                'option_value' => wp_json_encode( $entry ),
                'autoload'     => 'no',
            ] );
            $wpdb->query( 'COMMIT' );
            wp_cache_delete( $opt_key, 'options' );
            return [ 'allowed' => true, 'remaining' => $limit - 1, 'reset_at' => $entry['reset_at'] ];
        }

        $entry = json_decode( $raw, true );

        // Fenster abgelaufen → zurücksetzen
        if ( ! $entry || (int) $entry['reset_at'] < $now ) {
            $entry = [ 'count' => 1, 'reset_at' => $now + $window_seconds ];
            $wpdb->update(
                $wpdb->options,
                [ 'option_value' => wp_json_encode( $entry ) ],
                [ 'option_name'  => $opt_key ]
            );
            $wpdb->query( 'COMMIT' );
            wp_cache_delete( $opt_key, 'options' );
            return [ 'allowed' => true, 'remaining' => $limit - 1, 'reset_at' => $entry['reset_at'] ];
        }

        // Limit überschritten
        if ( (int) $entry['count'] >= $limit ) {
            $wpdb->query( 'ROLLBACK' );
            return [ 'allowed' => false, 'remaining' => 0, 'reset_at' => (int) $entry['reset_at'] ];
        }

        // Zähler erhöhen
        $entry['count']++;
        $wpdb->update(
            $wpdb->options,
            [ 'option_value' => wp_json_encode( $entry ) ],
            [ 'option_name'  => $opt_key ]
        );
        $wpdb->query( 'COMMIT' );
        wp_cache_delete( $opt_key, 'options' );

        return [
            'allowed'   => true,
            'remaining' => $limit - (int) $entry['count'],
            'reset_at'  => (int) $entry['reset_at'],
        ];
    }

    /**
     * Löscht alle Rate-Limit-Einträge (Deaktivierung + täglicher Cron-Cleanup).
     * Stale Einträge (reset_at in der Vergangenheit) werden entfernt.
     * Wird aus SubmissionsLog::on_deactivation() und dem Purge-Cron aufgerufen.
     */
    public static function cleanup(): void {
        global $wpdb;

        $prefix = self::OPT_PREFIX;
        $now    = time();

        // Alle kw_pv_rl_*-Einträge laden und stale löschen
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options}
             WHERE option_name LIKE %s",
            $wpdb->esc_like( $prefix ) . '%'
        ) );

        foreach ( $rows as $row ) {
            $entry = json_decode( $row->option_value, true );
            if ( ! $entry || (int) $entry['reset_at'] < $now ) {
                delete_option( $row->option_name );
            }
        }
    }

    /**
     * Löscht ALLE Rate-Limit-Einträge (bei Plugin-Deaktivierung).
     */
    public static function delete_all(): void {
        global $wpdb;

        $wpdb->query( $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like( self::OPT_PREFIX ) . '%'
        ) );
    }

    public static function get_client_ip(): string {
        // CF-Connecting-IP is set by Cloudflare and overrides the client-supplied X-Forwarded-For.
        // X-Forwarded-For and X-Real-IP are client-spoofable — never trust them for rate-limiting.
        $cf = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
        if ( $cf ) {
            $cf = trim( $cf );
            if ( filter_var( $cf, FILTER_VALIDATE_IP ) ) return $cf;
        }

        $remote = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return filter_var( $remote, FILTER_VALIDATE_IP ) ? $remote : '0.0.0.0';
    }
}
