<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Generates sequential ticket reference IDs in the format KW-PV-YYYY-NNNNN.
 *
 * One counter option per calendar year (`kw_pv_tools_ticket_counter_2026`, …).
 * No rollover logic → no race window around midnight on Jan 1.
 *
 * Atomicity within a year:
 *   LAST_INSERT_ID(expr) is connection-scoped in MySQL, so concurrent
 *   UPDATEs under PHP-FPM each receive a distinct incremented value
 *   without needing an explicit transaction.
 *
 * Old storage (pre-B3):
 *   `kw_pv_tools_ticket_counter` + `kw_pv_tools_ticket_year` (shared row).
 *   Those options are left in place; uninstall.php will clean them up.
 */
class TicketId {

    const COUNTER_OPTION_PREFIX = 'kw_pv_tools_ticket_counter_';

    public static function generate(): string {
        global $wpdb;

        $current_year = (int) date( 'Y' );
        $opt_name     = self::COUNTER_OPTION_PREFIX . $current_year;

        // Ensure the counter row for this year exists before the atomic UPDATE.
        // add_option() with autoload='no' is idempotent and safe under races —
        // a concurrent request that also tries to add will simply fail silently
        // and proceed to the UPDATE.
        if ( false === get_option( $opt_name ) ) {
            add_option( $opt_name, '0', '', 'no' );
        }

        // Atomic increment via LAST_INSERT_ID(expr). Each connection gets
        // its own return value, so parallel requests receive 1, 2, 3, …
        // with no duplicates.
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$wpdb->options}
                SET option_value = LAST_INSERT_ID( CAST(option_value AS UNSIGNED) + 1 )
              WHERE option_name = %s",
            $opt_name
        ) );

        $counter = (int) $wpdb->get_var( 'SELECT LAST_INSERT_ID()' );

        // Keep WP's in-memory option cache in sync so subsequent reads in
        // the same request don't return a stale value.
        wp_cache_set( $opt_name, (string) $counter, 'options' );

        return sprintf( 'KW-PV-%d-%05d', $current_year, $counter );
    }
}
