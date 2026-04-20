<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Generates sequential ticket reference IDs in the format KW-PV-YYYY-NNNNN.
 * Counter resets at the start of each new year.
 *
 * Atomicity: uses MySQL's LAST_INSERT_ID() trick — the UPDATE and the
 * returned value are both scoped to the current DB connection, so two
 * concurrent requests can never receive the same counter value.
 */
class TicketId {

    const COUNTER_OPTION = 'kw_pv_tools_ticket_counter';
    const YEAR_OPTION    = 'kw_pv_tools_ticket_year';

    public static function generate(): string {
        global $wpdb;

        $current_year = (int) date( 'Y' );

        // Year-rollover: reset counter when the calendar year changes.
        // Two simultaneous rollovers on Jan 1 are harmless — both write the
        // same year and reset to 0; the subsequent atomic increment still
        // yields unique values (1 and 2 respectively).
        $stored_year = (int) get_option( self::YEAR_OPTION, 0 );
        if ( $stored_year !== $current_year ) {
            update_option( self::YEAR_OPTION, $current_year );
            // Direct SQL so we can also reset autoload cache cleanly
            $wpdb->update(
                $wpdb->options,
                [ 'option_value' => '0' ],
                [ 'option_name'  => self::COUNTER_OPTION ]
            );
            wp_cache_delete( self::COUNTER_OPTION, 'options' );
        }

        // Ensure the counter row exists before the atomic UPDATE
        if ( false === get_option( self::COUNTER_OPTION ) ) {
            add_option( self::COUNTER_OPTION, '0', '', 'no' );
        }

        // Atomic increment: LAST_INSERT_ID() is connection-scoped in MySQL.
        // Even if another request runs the same UPDATE concurrently, each
        // connection receives its own distinct incremented value.
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$wpdb->options}
                SET option_value = LAST_INSERT_ID( CAST(option_value AS UNSIGNED) + 1 )
              WHERE option_name = %s",
            self::COUNTER_OPTION
        ) );

        $counter = (int) $wpdb->get_var( 'SELECT LAST_INSERT_ID()' );

        // Keep WP's in-memory option cache in sync so the same request
        // doesn't read a stale value later.
        wp_cache_set( self::COUNTER_OPTION, (string) $counter, 'options' );

        return sprintf( 'KW-PV-%d-%05d', $current_year, $counter );
    }
}
