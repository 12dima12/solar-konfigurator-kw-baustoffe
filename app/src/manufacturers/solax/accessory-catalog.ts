/**
 * Accessory options for the SolaX configurator.
 *
 * Extracted from the reference GBC Solino configurator (Zubehör-Phase).
 * Structured in four groups:
 *   - Batterie: quantity is derived from the number of battery modules
 *   - Dongle: 0..1 selection for data transmission
 *   - Weitere: 0..n optional accessories
 *   - Smart Meter: 0..1 selection filtered by inverter phase (X1 vs X3)
 */

export interface DongleOption {
  key: string;
  label: string;
  productName: string;
  hint?: string;
}

export interface OtherAccessory {
  key: string;
  label: string;
  code: string;
  productName: string;
  description?: string;
  comingSoon?: boolean;
}

export interface SmartMeterOption {
  key: string;
  phase: "X1" | "X3";
  label: string;
  productName: string;
}

export const SOLAX_DONGLES: DongleOption[] = [
  {
    key: "dongle-4g",
    label: "Dongle 4G",
    productName: "Solax Pocket Dongle 4G 3.0",
    hint: "für SIM-Karte",
  },
  {
    key: "dongle-wifi-3",
    label: "Dongle WiFi 3.0",
    productName: "Solax Pocket Dongle WiFi 3.0",
  },
  {
    key: "dongle-wifi-lan",
    label: "Dongle WiFi + LAN",
    productName: "Solax Pocket Dongle WiFi+LAN 10s",
    hint: "Beliebte Wahl · 10 Sek. Datenübertragung",
  },
  {
    key: "dongle-wifi-plus",
    label: "Dongle WiFi 3.0 Plus",
    productName: "Pocket WiFi Dongle V3.0 PLUS 10s",
    hint: "Erweiterte WiFi-Reichweite",
  },
];

export const SOLAX_OTHER_ACCESSORIES: OtherAccessory[] = [
  {
    key: "adapter-box",
    label: "Adapter Box G2",
    code: "B-210-G210",
    productName: "Solax Adapter Box G2",
    description: "Wärmepumpen-Anschluss · SG Ready · Dry Contact · Analog",
  },
  {
    key: "wireless-bridge",
    label: "Wireless Bridge",
    code: "B-210-1005",
    productName: "Solax Chint Wireless Bridge",
    description: "Funkbrücke zwischen Smart Meter, Wallbox und Wechselrichter",
  },
  {
    key: "datahub-1000",
    label: "DataHub 1000",
    code: "DATAHUB-1000",
    productName: "Solax DataHub 1000",
  },
  {
    key: "xhub",
    label: "Xhub",
    code: "XHUB",
    productName: "Solax Xhub",
    comingSoon: true,
  },
];

export const SOLAX_SMART_METERS: SmartMeterOption[] = [
  {
    key: "dtsu666-3ph",
    phase: "X3",
    label: "Solax Chint 3Ph Meter DTSU666",
    productName: "Solax Chint 3Ph Meter DTSU666",
  },
  {
    key: "ddsu666-1ph",
    phase: "X1",
    label: "Solax Chint 1Ph Meter DDSU666",
    productName: "Solax Chint 1Ph Meter DDSU666",
  },
];

export const BATTERY_HOLDING_BRACKET = {
  label: "Holding Bracket",
  productName: "Solax Triple Power Holding Bracket",
  perNModules: 2, // one bracket per 2 modules (rounded up)
} as const;

export const BATTERY_BASE_PLATE = {
  label: "Base Plate",
  productName: "Solax Triple Power Base Plate",
  perNModules: 1, // one base plate per module
} as const;
