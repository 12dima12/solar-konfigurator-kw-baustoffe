<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

class Admin {

    const PAGE_SLUG    = 'kw-pv-tools';
    const OPTION_GROUP = 'kw_pv_tools_settings_group';

    public static function register(): void {
        add_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
    }

    public static function add_menu(): void {
        add_options_page(
            __( 'KW PV Tools', 'kw-pv-tools' ),
            __( 'KW PV Tools', 'kw-pv-tools' ),
            'manage_options',
            self::PAGE_SLUG,
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function register_settings(): void {
        register_setting(
            self::OPTION_GROUP,
            Settings::OPTION_KEY,
            [ 'sanitize_callback' => [ __CLASS__, 'sanitize' ] ]
        );
    }

    public static function sanitize( array $input ): array {
        $current         = Settings::all();
        $valid_providers = [ 'altcha', 'none' ];

        // sales_email: allow comma-separated list; sanitize each address
        $sales_raw    = $input['sales_email'] ?? get_option( 'admin_email' );
        $sales_emails = array_filter(
            array_map( 'sanitize_email', array_map( 'trim', explode( ',', $sales_raw ) ) ),
            'is_email'
        );
        $sales_email  = implode( ', ', $sales_emails ) ?: sanitize_email( get_option( 'admin_email' ) );

        return [
            'captcha_enabled'     => ! empty( $input['captcha_enabled'] ),
            'captcha_provider'    => in_array( $input['captcha_provider'] ?? '', $valid_providers, true )
                ? $input['captcha_provider'] : 'altcha',
            'altcha_hmac_key'     => sanitize_text_field( $input['altcha_hmac_key'] ?? ( $current['altcha_hmac_key'] ?? '' ) ),
            'altcha_complexity'   => max( 1000, min( 1000000, (int) ( $input['altcha_complexity'] ?? 100000 ) ) ),
            'sales_email'         => $sales_email,
            'from_email'          => sanitize_email( $input['from_email'] ?? get_option( 'admin_email' ) ),
            'rate_limit_per_hour' => max( 1, min( 100, (int) ( $input['rate_limit_per_hour'] ?? 3 ) ) ),
            'default_lang'        => in_array( $input['default_lang'] ?? '', [ 'de', 'en', 'cs' ], true )
                ? $input['default_lang'] : 'de',
        ];
    }

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) return;
        $s = Settings::all();
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

            <?php
            $manifest      = \KW_PV_Tools\Core\Assets::get_konfigurator_manifest();
            $manifest_ok   = ! empty( $manifest );
            $manifest_ver  = $manifest['version'] ?? '—';
            $manifest_date = $manifest['generatedAt'] ?? '—';
            ?>
            <div class="notice <?php echo $manifest_ok ? 'notice-success' : 'notice-warning'; ?> is-dismissible" style="padding:8px 12px;">
                <?php if ( $manifest_ok ): ?>
                    <p><?php printf( __( '✓ Konfigurator-Bundle geladen (v%s, erzeugt %s)', 'kw-pv-tools' ), esc_html( $manifest_ver ), esc_html( $manifest_date ) ); ?></p>
                <?php else: ?>
                    <p><?php _e( '⚠ Kein Konfigurator-Bundle gefunden. Bitte <code>sync-konfigurator.sh</code> ausführen und Dateien nach <code>assets/konfigurator/</code> kopieren.', 'kw-pv-tools' ); ?></p>
                <?php endif; ?>
            </div>

            <form action="options.php" method="post">
                <?php settings_fields( self::OPTION_GROUP ); ?>

                <h2><?php _e( 'E-Mail', 'kw-pv-tools' ); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="sales_email"><?php _e( 'Vertriebs-E-Mail (Empfänger)', 'kw-pv-tools' ); ?></label></th>
                        <td><input type="text" id="sales_email" name="kw_pv_tools_settings[sales_email]"
                                value="<?php echo esc_attr( $s['sales_email'] ?? '' ); ?>" class="large-text">
                            <p class="description"><?php _e( 'Hierhin werden neue Konfigurationen gesendet. Mehrere Adressen kommasepariert eingeben.', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="from_email"><?php _e( 'Absender-E-Mail', 'kw-pv-tools' ); ?></label></th>
                        <td><input type="email" id="from_email" name="kw_pv_tools_settings[from_email]"
                                value="<?php echo esc_attr( $s['from_email'] ?? '' ); ?>" class="regular-text">
                            <p class="description"><?php _e( 'Empfehlung: WP Mail SMTP Plugin konfigurieren für zuverlässigen Versand.', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                </table>

                <h2><?php _e( 'Captcha', 'kw-pv-tools' ); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><?php _e( 'Captcha aktiviert', 'kw-pv-tools' ); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" id="captcha_enabled" name="kw_pv_tools_settings[captcha_enabled]"
                                    value="1" <?php checked( $s['captcha_enabled'] ?? true ); ?>>
                                <?php _e( 'Captcha beim Abschicken des Formulars anfordern', 'kw-pv-tools' ); ?>
                            </label>
                            <p class="description"><?php _e( 'Deaktivieren nur zu Testzwecken empfohlen.', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="captcha_provider"><?php _e( 'Provider', 'kw-pv-tools' ); ?></label></th>
                        <td>
                            <select id="captcha_provider" name="kw_pv_tools_settings[captcha_provider]">
                                <?php foreach ( [ 'altcha' => 'Altcha (Standard, self-hosted PoW)', 'none' => 'Kein Captcha (nur für interne Tests)' ] as $val => $label ): ?>
                                    <option value="<?php echo esc_attr( $val ); ?>" <?php selected( $s['captcha_provider'] ?? 'altcha', $val ); ?>>
                                        <?php echo esc_html( $label ); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description"><?php _e( 'Wird ignoriert wenn Captcha deaktiviert ist.', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="altcha_hmac_key"><?php _e( 'Altcha HMAC-Key', 'kw-pv-tools' ); ?></label></th>
                        <td><input type="text" id="altcha_hmac_key" name="kw_pv_tools_settings[altcha_hmac_key]"
                                value="<?php echo esc_attr( $s['altcha_hmac_key'] ?? '' ); ?>" class="regular-text">
                            <p class="description"><?php _e( 'Automatisch generiert bei Aktivierung. Nicht öffentlich teilen.', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="altcha_complexity"><?php _e( 'Altcha Komplexität', 'kw-pv-tools' ); ?></label></th>
                        <td><input type="number" id="altcha_complexity" name="kw_pv_tools_settings[altcha_complexity]"
                                value="<?php echo esc_attr( $s['altcha_complexity'] ?? 100000 ); ?>" min="1000" max="1000000">
                            <p class="description"><?php _e( 'Höher = schwieriger (empfohlen: 50000–200000).', 'kw-pv-tools' ); ?></p>
                        </td>
                    </tr>
                </table>

                <h2><?php _e( 'Sicherheit & Allgemein', 'kw-pv-tools' ); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="rate_limit_per_hour"><?php _e( 'Rate-Limit (Submits/Stunde/IP)', 'kw-pv-tools' ); ?></label></th>
                        <td><input type="number" id="rate_limit_per_hour" name="kw_pv_tools_settings[rate_limit_per_hour]"
                                value="<?php echo esc_attr( $s['rate_limit_per_hour'] ?? 3 ); ?>" min="1" max="100"></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="default_lang"><?php _e( 'Standard-Sprache', 'kw-pv-tools' ); ?></label></th>
                        <td>
                            <select id="default_lang" name="kw_pv_tools_settings[default_lang]">
                                <?php foreach ( [ 'de' => 'Deutsch', 'en' => 'English', 'cs' => 'Čeština' ] as $val => $label ): ?>
                                    <option value="<?php echo esc_attr( $val ); ?>" <?php selected( $s['default_lang'] ?? 'de', $val ); ?>>
                                        <?php echo esc_html( $label ); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                </table>

                <?php submit_button(); ?>
            </form>

            <?php TestMail::render_button(); ?>
        </div>
        <?php
    }
}
