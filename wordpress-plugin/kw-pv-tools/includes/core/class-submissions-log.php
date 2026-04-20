<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Submissions Log — stores each form submission as a custom post type.
 * Posts are automatically deleted after 30 days via WP-Cron.
 */
class SubmissionsLog {

    const POST_TYPE  = 'kw_pv_submission';
    const CRON_HOOK  = 'kw_pv_tools_purge_submissions';
    const RETENTION  = 30; // days

    public static function register(): void {
        add_action( 'init',              [ __CLASS__, 'register_post_type' ] );
        add_action( self::CRON_HOOK,     [ __CLASS__, 'purge_old_entries' ] );
        add_action( 'admin_menu',        [ __CLASS__, 'add_log_menu' ] );

        if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
            wp_schedule_event( time(), 'daily', self::CRON_HOOK );
        }

        // GDPR erasure integration
        add_filter( 'wp_privacy_personal_data_exporters', [ __CLASS__, 'register_exporter' ] );
        add_filter( 'wp_privacy_personal_data_erasers',  [ __CLASS__, 'register_eraser' ] );
    }

    public static function register_post_type(): void {
        register_post_type( self::POST_TYPE, [
            'label'           => __( 'PV-Anfragen', 'kw-pv-tools' ),
            'public'          => false,
            'show_ui'         => true,
            'show_in_menu'    => false,
            'capability_type' => 'post',
            'capabilities'    => [ 'create_posts' => 'do_not_allow' ],
            'map_meta_cap'    => true,
            'supports'        => [ 'title' ],
        ] );
    }

    public static function add_log_menu(): void {
        add_submenu_page(
            'options-general.php',
            __( 'PV-Anfragen Log', 'kw-pv-tools' ),
            __( 'PV-Anfragen', 'kw-pv-tools' ),
            'manage_options',
            'edit.php?post_type=' . self::POST_TYPE
        );
    }

    /**
     * Save a submission to the log.
     *
     * @param array $data Validated submission data (must include 'ticket').
     * @return int|false WP_Post ID or false on failure.
     */
    public static function save( array $data ) {
        $ticket = $data['ticket'] ?? 'unknown';
        $name   = $data['contact']['name'] ?? '';
        $email  = $data['contact']['email'] ?? '';

        $post_id = wp_insert_post( [
            'post_type'   => self::POST_TYPE,
            'post_title'  => sprintf( '%s — %s', $ticket, $name ),
            'post_status' => 'publish',
            'meta_input'  => [
                '_kw_pv_ticket'       => $ticket,
                '_kw_pv_contact_name' => $name,
                '_kw_pv_contact_email'=> $email,
                '_kw_pv_manufacturer' => $data['manufacturer'] ?? '',
                '_kw_pv_payload'      => wp_json_encode( $data ),
            ],
        ] );

        return is_wp_error( $post_id ) ? false : $post_id;
    }

    public static function purge_old_entries(): void {
        $cutoff = date( 'Y-m-d H:i:s', strtotime( '-' . self::RETENTION . ' days' ) );
        // Max 100 per cron run to avoid timeout. Runs daily → clears backlog over several days if needed.
        $posts  = get_posts( [
            'post_type'      => self::POST_TYPE,
            'post_status'    => 'any',
            'posts_per_page' => 100,
            'date_query'     => [ [ 'before' => $cutoff ] ],
            'fields'         => 'ids',
        ] );
        foreach ( $posts as $id ) {
            wp_delete_post( $id, true );
        }
    }

    public static function on_deactivation(): void {
        wp_clear_scheduled_hook( self::CRON_HOOK );
    }

    // --- GDPR ---

    public static function register_exporter( array $exporters ): array {
        $exporters['kw-pv-tools'] = [
            'exporter_friendly_name' => __( 'KW PV Tools — PV-Anfragen', 'kw-pv-tools' ),
            'callback'               => [ __CLASS__, 'export_personal_data' ],
        ];
        return $exporters;
    }

    public static function register_eraser( array $erasers ): array {
        $erasers['kw-pv-tools'] = [
            'eraser_friendly_name' => __( 'KW PV Tools — PV-Anfragen', 'kw-pv-tools' ),
            'callback'             => [ __CLASS__, 'erase_personal_data' ],
        ];
        return $erasers;
    }

    public static function export_personal_data( string $email, int $page = 1 ): array {
        $posts = self::get_posts_by_email( $email );
        $items = [];
        foreach ( $posts as $post ) {
            $items[] = [
                'group_id'    => self::POST_TYPE,
                'group_label' => __( 'PV-Anfragen', 'kw-pv-tools' ),
                'item_id'     => 'kw-pv-submission-' . $post->ID,
                'data'        => [
                    [ 'name' => __( 'Ticket', 'kw-pv-tools' ),  'value' => get_post_meta( $post->ID, '_kw_pv_ticket', true ) ],
                    [ 'name' => __( 'Name', 'kw-pv-tools' ),    'value' => get_post_meta( $post->ID, '_kw_pv_contact_name', true ) ],
                    [ 'name' => __( 'E-Mail', 'kw-pv-tools' ),  'value' => $email ],
                    [ 'name' => __( 'Datum', 'kw-pv-tools' ),   'value' => get_the_date( 'd.m.Y H:i', $post ) ],
                ],
            ];
        }
        return [ 'data' => $items, 'done' => true ];
    }

    public static function erase_personal_data( string $email, int $page = 1 ): array {
        $posts   = self::get_posts_by_email( $email );
        $removed = 0;
        foreach ( $posts as $post ) {
            wp_delete_post( $post->ID, true );
            $removed++;
        }
        return [ 'items_removed' => $removed, 'items_retained' => 0, 'messages' => [], 'done' => true ];
    }

    private static function get_posts_by_email( string $email ): array {
        return get_posts( [
            'post_type'      => self::POST_TYPE,
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'meta_query'     => [ [
                'key'   => '_kw_pv_contact_email',
                'value' => sanitize_email( $email ),
            ] ],
        ] );
    }
}
