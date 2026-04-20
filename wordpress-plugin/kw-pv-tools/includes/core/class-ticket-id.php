<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Generates sequential ticket reference IDs in the format KW-PV-YYYY-NNNNN.
 * Counter resets at the start of each new year.
 */
class TicketId {

    const COUNTER_OPTION = 'kw_pv_tools_ticket_counter';
    const YEAR_OPTION    = 'kw_pv_tools_ticket_year';

    public static function generate(): string {
        $current_year = (int) date( 'Y' );
        $stored_year  = (int) get_option( self::YEAR_OPTION, 0 );

        if ( $stored_year !== $current_year ) {
            update_option( self::YEAR_OPTION, $current_year );
            update_option( self::COUNTER_OPTION, 0 );
        }

        $counter = (int) get_option( self::COUNTER_OPTION, 0 ) + 1;
        update_option( self::COUNTER_OPTION, $counter );

        return sprintf( 'KW-PV-%d-%05d', $current_year, $counter );
    }
}
