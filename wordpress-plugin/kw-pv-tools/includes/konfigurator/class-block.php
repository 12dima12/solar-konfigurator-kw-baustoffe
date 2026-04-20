<?php
namespace KW_PV_Tools\Konfigurator;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Gutenberg-Block kw-pv-tools/konfigurator.
 *
 * Rendert die gleiche Ausgabe wie der Shortcode,
 * ist aber im Block-Editor wählbar.
 */
class Block {

    const BLOCK_NAME = 'kw-pv-tools/konfigurator';

    public static function register(): void {
        add_action( 'init', [ __CLASS__, 'register_block' ] );
    }

    public static function register_block(): void {
        if ( ! function_exists( 'register_block_type' ) ) return;

        register_block_type( self::BLOCK_NAME, [
            'render_callback' => [ __CLASS__, 'render' ],
            'attributes'      => [
                'manufacturer'   => [ 'type' => 'string', 'default' => 'solax' ],
                'route'          => [ 'type' => 'string', 'default' => 'embed' ],
                'lang'           => [ 'type' => 'string', 'default' => '' ],
                'preset_kwp'     => [ 'type' => 'string', 'default' => '' ],
                'preset_battery' => [ 'type' => 'string', 'default' => '' ],
            ],
        ] );
    }

    public static function render( array $attributes ): string {
        return Shortcode::render( $attributes );
    }
}
