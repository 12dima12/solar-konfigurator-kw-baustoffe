<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Mapping Produktname → Artikelcode (SolaX/GBC-Nomenklatur).
 *
 * Diese Tabelle wird SERVERSEITIG gepflegt und taucht nie in der UI auf.
 * Sie speist nur den PDF-Generator und die Sales-Mail, damit bestellfertige
 * Artikelcodes in der Produktliste stehen.
 *
 * Quellen:
 *   - IES-Referenz-PDF vom Kunden (G-21d-3I60a, G-210-503m, EV-210-118L,
 *     G-690-9I00..02)
 *   - Live-Scrape der GBC-Solino-Summary (X3 Hybrid G4 Split System:
 *     G-21c-4205, G-690-926m/s, B-210-* Serien)
 *
 * Fehlende Codes (User kann nachliefern) werden als null eingetragen —
 * dann wird im PDF "—" gerendert statt einem falschen Code.
 */
class ArticleCodes {

	/** @var array<string,string|null> Produktname → Code (oder null = unbekannt). */
	const MAPPING = [
		// -- Wechselrichter --
		'Solax G4 X3-Hybrid-5.0-D, CT, ohne WiFi 3.0' => 'G-21c-4205',
		'Solax X3-IES-6.0K, AFCI, WiFi+LAN, CT'       => 'G-21d-3I60a',

		// -- Backup / Matebox / EPS --
		'Solax X3-Matebox G2'                          => 'G-210-503m',
		'Solax X3-Matebox Advanced, D, V1.4, WiFi 3.0P, denoise' => null,
		'Solax X3-EPS Box, 3*63 A'                     => null,
		'Solax X3-EPS PBOX-60kW-G2'                    => null,
		'Solax X1-Matebox Advanced, D '                => null,
		'Solax X1-EPS Box, 1*63 A'                     => null,

		// -- Wallbox / HAC --
		'Solax X3-HAC-11S, 1/3 phase shift'            => null,
		'Solax X3-HAC-11S - L, 1/3 phase shift'        => null,
		'Solax X3-HAC-11P, 1/3 phase shift'            => null,
		'Solax X3-HAC-11P - L, 1/3 phase shift'        => 'EV-210-118L',

		// -- Batterie Triple Power T58 --
		'Master' => 'G-690-926m',
		'Slave'  => 'G-690-926s',

		// -- Batterie IES HS50E-D --
		'BAT BOX'    => 'G-690-9I00',
		'BMS'        => 'G-690-9I01',
		'Series BOX' => 'G-690-9I02',

		// -- Batteriezubehör --
		'Solax Triple Power Holding Bracket' => null,
		'Solax Triple Power Base Plate'      => null,

		// -- Dongle --
		'Solax Pocket Dongle 4G 3.0'            => null,
		'Solax Pocket Dongle WiFi 3.0'          => null,
		'Solax Pocket Dongle WiFi+LAN 10s'      => 'B-210-1020',
		'Pocket WiFi Dongle V3.0 PLUS 10s'      => null,

		// -- Extras --
		'Solax Adapter Box G2'                  => 'B-210-G210',
		'Solax Chint Wireless Bridge'           => 'B-210-1005',
		'Solax DataHub 1000'                    => 'B-210-1u15',
		'Solax Xhub'                            => null,

		// -- Smart Meter --
		'Solax Chint 3Ph Meter DTSU666' => 'B-210-1003',
		'Solax Chint 1Ph Meter DDSU666' => null,
	];

	/**
	 * Gibt den Artikelcode für einen Produktnamen zurück, oder null wenn
	 * nicht hinterlegt. Namen-Normalisierung: Trim + mehrfache Whitespaces
	 * werden zu einem Space reduziert, damit Encoding-Unterschiede keine
	 * Miss-Hits erzeugen.
	 */
	public static function lookup( string $product_name ): ?string {
		$key = self::normalize( $product_name );
		foreach ( self::MAPPING as $k => $v ) {
			if ( self::normalize( $k ) === $key ) return $v;
		}
		return null;
	}

	private static function normalize( string $s ): string {
		$s = preg_replace( '/\s+/', ' ', $s );
		return trim( (string) $s );
	}
}
