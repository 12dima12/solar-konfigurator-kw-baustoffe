<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

class Settings {

    const OPTION_KEY = 'kw_pv_tools_settings';

    public static function get( string $key, $default = null ) {
        $settings = get_option( self::OPTION_KEY, [] );
        return $settings[ $key ] ?? $default;
    }

    public static function all(): array {
        return (array) get_option( self::OPTION_KEY, [] );
    }

    public static function update( array $values ): bool {
        return update_option( self::OPTION_KEY, array_merge( self::all(), $values ) );
    }
}
