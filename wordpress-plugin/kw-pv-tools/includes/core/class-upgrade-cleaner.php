<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Pre-install cleanup for plugin upgrades.
 *
 * Problem on shared WordPress hosts:
 *   PHP-FPM runs as `www-data` (or similar), while plugin files were
 *   originally uploaded via FTP/SFTP as a different user. The two users
 *   belong to different groups and can't overwrite each other's files.
 *   WordPress's auto-update uses copy_dir() to overwrite the existing
 *   plugin folder with the contents of the new ZIP. When copy_dir hits
 *   a file it can't overwrite, the whole update aborts with:
 *     "The update cannot be installed because some files could not be
 *      copied. This is usually due to inconsistent file permissions."
 *
 * Why deleting works even when overwriting doesn't:
 *   Linux directory-level semantics — the owner of a *directory* may
 *   unlink entries inside it, even if the entries themselves are owned
 *   by a different user. `www-data` is almost always at least a member
 *   of the group that owns `wp-content/plugins/kw-pv-tools/`, so it
 *   can delete files there, but it can't replace them in place because
 *   the replace semantics check ownership on the target file.
 *
 * Fix:
 *   We hook into `upgrader_pre_install` — fired right after WP has
 *   extracted the new ZIP but before it copies the extracted tree into
 *   `wp-content/plugins/kw-pv-tools/`. At that point we delete the
 *   existing plugin directory outright. WP's subsequent copy_dir then
 *   lands on a clean slate and succeeds.
 *
 * Safety:
 *   - Only fires when the plugin being upgraded is this one
 *     (single-plugin AND bulk-plugin update paths both handled).
 *   - Only deletes the kw-pv-tools/ plugin directory — no path
 *     traversal possible because we build the path from WP_PLUGIN_DIR
 *     + a hard-coded directory name.
 *   - If delete fails, we still return early without breaking WP's
 *     normal flow; the user would then see the original WP error.
 */
class UpgradeCleaner {

    public static function register(): void {
        add_filter( 'upgrader_pre_install', [ __CLASS__, 'maybe_cleanup' ], 10, 2 );
    }

    /**
     * @param mixed $return  Either true, a WP_Error, or whatever a prior
     *                       filter handler returned. We must pass it through.
     * @param array $options hook_extra — contains 'plugin' (single) or
     *                       'plugins' (bulk) with the plugin basename.
     */
    public static function maybe_cleanup( $return, array $options ) {
        // A prior filter handler already errored — do nothing, let the
        // error propagate. WP skips the install if $return is WP_Error.
        if ( is_wp_error( $return ) ) return $return;

        if ( ! self::is_our_plugin( $options ) ) return $return;

        self::ensure_filesystem();

        global $wp_filesystem;
        if ( ! $wp_filesystem ) return $return;

        $plugin_dir = trailingslashit( WP_PLUGIN_DIR ) . dirname( KW_PV_TOOLS_BASENAME );
        if ( ! $wp_filesystem->exists( $plugin_dir ) ) return $return;

        // Recursive delete. Failure here is non-fatal — we just let WP
        // proceed and report its own error if it still can't copy.
        $deleted = $wp_filesystem->delete( $plugin_dir, true );
        if ( ! $deleted ) {
            error_log( '[kw-pv-tools] upgrader_pre_install: failed to delete ' . $plugin_dir );
        }

        return $return;
    }

    /**
     * True if WP is upgrading kw-pv-tools specifically (single or bulk).
     */
    private static function is_our_plugin( array $options ): bool {
        $basename = KW_PV_TOOLS_BASENAME;
        if ( ( $options['plugin'] ?? '' ) === $basename ) return true;
        if ( isset( $options['plugins'] ) && is_array( $options['plugins'] ) ) {
            return in_array( $basename, $options['plugins'], true );
        }
        return false;
    }

    /**
     * Ensure $wp_filesystem is initialised. During an upgrade request
     * this is almost always already done by WP_Upgrader itself, but we
     * guard for defensive reasons.
     */
    private static function ensure_filesystem(): void {
        global $wp_filesystem;
        if ( $wp_filesystem ) return;

        if ( ! function_exists( 'WP_Filesystem' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        WP_Filesystem();
    }
}
