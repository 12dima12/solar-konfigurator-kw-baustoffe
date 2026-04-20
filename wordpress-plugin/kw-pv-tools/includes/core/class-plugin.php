<?php
namespace KW_PV_Tools;

use KW_PV_Tools\Core\RestApi;
use KW_PV_Tools\Core\EventBus;
use KW_PV_Tools\Core\Admin;
use KW_PV_Tools\Core\DependencyCheck;
use KW_PV_Tools\Core\SubmissionsLog;
use KW_PV_Tools\Core\SystemCheck;
use KW_PV_Tools\Core\TestMail;
use KW_PV_Tools\Core\MailPreview;
use KW_PV_Tools\Konfigurator\Shortcode;
use KW_PV_Tools\Konfigurator\Block;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Plugin-Bootstrap.
 * Singleton — Instanz wird einmal via `plugins_loaded` erzeugt.
 */
class Plugin {

    private static ?Plugin $instance = null;

    public static function instance(): Plugin {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', [ $this, 'load_textdomain' ] );

        DependencyCheck::register();
        SubmissionsLog::register();
        SystemCheck::register();
        TestMail::register();
        MailPreview::register();
        RestApi::register();
        EventBus::register();
        Shortcode::register();
        Block::register();

        if ( is_admin() ) {
            Admin::register();
        }
    }

    public function load_textdomain(): void {
        load_plugin_textdomain(
            'kw-pv-tools',
            false,
            dirname( KW_PV_TOOLS_BASENAME ) . '/languages'
        );
    }
}
