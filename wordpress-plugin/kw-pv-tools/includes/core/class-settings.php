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

    public static function get_captcha_enabled(): bool {
        return (bool) self::get( 'captcha_enabled', true );
    }

    public static function get_captcha_provider_effective(): string {
        if ( ! self::get_captcha_enabled() ) return 'none';
        $provider = self::get( 'captcha_provider', 'altcha' );
        $valid    = [ 'altcha', 'none' ];
        return in_array( $provider, $valid, true ) ? $provider : 'altcha';
    }

    public static function get_sales_emails(): array {
        $raw    = self::get( 'sales_email', get_option( 'admin_email' ) );
        $emails = array_map( 'trim', explode( ',', $raw ) );
        return array_values( array_filter( $emails, 'is_email' ) );
    }
}
