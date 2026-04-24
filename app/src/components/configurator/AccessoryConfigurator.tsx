"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfigStore } from "@/store/configStore";
import {
  SOLAX_DONGLES,
  SOLAX_OTHER_ACCESSORIES,
  SOLAX_SMART_METERS,
  BATTERY_HOLDING_BRACKET,
  BATTERY_BASE_PLATE,
} from "@/manufacturers/solax/accessory-catalog";
import { computeBatteryAccessories } from "@/lib/battery-accessory";
import { SOLAX_BATTERY_SERIES } from "@/manufacturers/solax/battery-series";
import type { Lang } from "@/data/types";
import { Check, Battery, Radio, Package, Gauge, RotateCcw } from "lucide-react";

export interface AccessorySelection {
  summary: string;          // short breadcrumb text
  productListMulti: string; // " · "-separated list for the sales email
  items: Array<{ name: string; qty: number; category: string }>;
}

interface Props {
  lang: Lang;
  onConfirm: (payload: AccessorySelection) => void;
  onBack: () => void;
}

const UI = {
  de: {
    title: "Zubehör auswählen",
    forBattery: "Zubehör für Batterie",
    autoDerived: "Wird automatisch aus der Modulanzahl berechnet",
    selectDongle: "Dongle auswählen",
    noDongle: "Kein Dongle",
    others: "Weitere (optional)",
    smartMeter: "Smart Meter",
    noMeter: "Kein Smart Meter",
    confirm: "Zubehör übernehmen",
    back: "Zurück",
    reset: "Zurücksetzen",
    popular: "Beliebte Wahl",
    comingSoon: "Demnächst verfügbar",
    module: "Modul",
    modules: "Module",
    noAccessories: "Kein Zubehör",
    item: "Position",
    itemsFew: "Positionen",
    items: "Positionen",
  },
  en: {
    title: "Select accessories",
    forBattery: "Battery accessories",
    autoDerived: "Derived automatically from the module count",
    selectDongle: "Select dongle",
    noDongle: "No dongle",
    others: "Other (optional)",
    smartMeter: "Smart meter",
    noMeter: "No meter",
    confirm: "Confirm accessories",
    back: "Back",
    reset: "Reset",
    popular: "Popular choice",
    comingSoon: "Coming soon",
    module: "module",
    modules: "modules",
    noAccessories: "No accessories",
    item: "item",
    itemsFew: "items",
    items: "items",
  },
  cs: {
    title: "Vyberte příslušenství",
    forBattery: "Příslušenství pro baterii",
    autoDerived: "Automaticky podle počtu modulů",
    selectDongle: "Vyberte dongle",
    noDongle: "Bez donglu",
    others: "Další (volitelné)",
    smartMeter: "Smart meter",
    noMeter: "Bez meteru",
    confirm: "Potvrdit příslušenství",
    back: "Zpět",
    reset: "Resetovat",
    popular: "Oblíbená volba",
    comingSoon: "Již brzy",
    module: "modul",
    modules: "moduly",
    noAccessories: "Žádné příslušenství",
    item: "položka",
    itemsFew: "položky",
    items: "položek",
  },
} satisfies Record<Lang, Record<string, string>>;

// Tschechisch unterscheidet drei Plural-Formen: "one" (1), "few" (2–4),
// "many" (5+). Deutsch/Englisch kennen nur "one" vs. "other"; dort zeigen
// `items` und `itemsFew` auf denselben String. Intl.PluralRules kapselt die
// CLDR-Regeln, damit wir nicht pro Sprache eigene Conditionals pflegen.
function pluralize(
  count: number,
  lang: Lang,
  t: { item: string; itemsFew: string; items: string },
): string {
  const rule = new Intl.PluralRules(lang).select(count);
  if (rule === "one") return t.item;
  if (rule === "few") return t.itemsFew;
  return t.items;
}

export function AccessoryConfigurator({ lang, onConfirm, onBack }: Props) {
  const t = UI[lang];
  const selections = useConfigStore((s) => s.selections);

  const batteryMeta = selections.find((s) => s.phase === "battery")?.selectedProduct?.batteryMeta;
  const moduleCount = batteryMeta?.moduleCount ?? 0;
  // Holding Bracket + Base Plate sind laut Hersteller ausschließlich für
  // T-BAT H 5.8 V3 vorgesehen — heutige Serien (Triple Power S/T, IES
  // HS50E-D) haben eine eigene Montagelösung im Gehäuse. `usesMountingAccessories`
  // ist daher ein Opt-in pro Serie; nur wer es explizit auf `true` setzt,
  // bekommt die Komponenten-Auflistung im Zubehör-Schritt.
  const selectedSeries = batteryMeta
    ? SOLAX_BATTERY_SERIES.find((s) => s.key === batteryMeta.seriesKey)
    : undefined;
  const seriesUsesMounting = selectedSeries?.usesMountingAccessories === true;
  const batteryAcc = seriesUsesMounting
    ? computeBatteryAccessories(moduleCount)
    : { brackets: 0, basePlates: 0 };

  // Smart-Meter-Auswahl: bei Neuinstallation filtert die Phase (X1 / X3)
  // aus der Inverter-Selektion. Bei AC-Kopplung gibt es keinen
  // Inverter-Schritt — der Kunde rüstet einen Speicher an einer
  // bestehenden PV-Anlage nach, deren Phase wir nicht kennen. Daher
  // zeigen wir dort beide Smart-Meter (1-phasig und 3-phasig) zur Auswahl;
  // der Kunde selektiert den passenden für sein Haus.
  const installationType = useConfigStore((s) => s.installationType);
  const inverterSteps = selections.find((s) => s.phase === "inverter")?.steps ?? [];
  const isX1 = inverterSteps.includes("Single-phase inverter X1");
  const isX3 = inverterSteps.includes("Three-phase inverter X3");
  const isACCoupling = installationType === "ac-coupling";
  const availableMeters = SOLAX_SMART_METERS.filter(
    (m) => isACCoupling || (isX1 && m.phase === "X1") || (isX3 && m.phase === "X3"),
  );

  // Default-Auswahl je Installationsmodus:
  //   - Neuinstallation: sinnvolle Voreinstellungen (WiFi+LAN-Dongle,
  //     Smart-Meter passend zur Inverter-Phase), damit der User nur
  //     Anpassungen treffen muss.
  //   - AC-Kopplung: bewusst beides auf "nichts" — der Retrofit-Kunde
  //     entscheidet aktiv, ob Dongle/Smart-Meter mit dazu sollen; es wird
  //     ihm nichts aufgedrängt.
  const [dongleKey, setDongleKey] = useState<string | null>(
    isACCoupling ? null : "dongle-wifi-lan",
  );
  const [otherKeys, setOtherKeys] = useState<Set<string>>(new Set());
  const [meterKey, setMeterKey] = useState<string | null>(
    isACCoupling ? null : availableMeters[0]?.key ?? null,
  );

  const toggleOther = (k: string) =>
    setOtherKeys((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const submit = () => {
    const lines: string[] = [];
    const summaryBits: string[] = [];
    const items: AccessorySelection["items"] = [];

    if (batteryAcc.brackets > 0) {
      lines.push(`${batteryAcc.brackets}× ${BATTERY_HOLDING_BRACKET.productName}`);
      summaryBits.push(`${batteryAcc.brackets}× Bracket`);
      items.push({ name: BATTERY_HOLDING_BRACKET.productName, qty: batteryAcc.brackets, category: "Batteriekomponenten" });
    }
    if (batteryAcc.basePlates > 0) {
      lines.push(`${batteryAcc.basePlates}× ${BATTERY_BASE_PLATE.productName}`);
      summaryBits.push(`${batteryAcc.basePlates}× Base Plate`);
      items.push({ name: BATTERY_BASE_PLATE.productName, qty: batteryAcc.basePlates, category: "Batteriekomponenten" });
    }

    if (dongleKey) {
      const d = SOLAX_DONGLES.find((x) => x.key === dongleKey);
      if (d) {
        lines.push(`1× ${d.productName}`);
        summaryBits.push(d.label);
        items.push({ name: d.productName, qty: 1, category: "Zubehör" });
      }
    }

    for (const k of otherKeys) {
      const o = SOLAX_OTHER_ACCESSORIES.find((x) => x.key === k);
      if (o && !o.comingSoon) {
        lines.push(`1× ${o.productName}`);
        summaryBits.push(o.label);
        items.push({
          name: o.productName,
          qty: 1,
          category: /DataHub/i.test(o.label) ? "Datenverwaltung"
            : /Wireless Bridge/i.test(o.label) ? "Überwachung"
            : /Adapter/i.test(o.label) ? "Adapter"
            : "Zubehör",
        });
      }
    }

    if (meterKey) {
      const m = SOLAX_SMART_METERS.find((x) => x.key === meterKey);
      if (m) {
        lines.push(`1× ${m.productName}`);
        summaryBits.push(m.label.replace("Solax Chint ", ""));
        items.push({ name: m.productName, qty: 1, category: "Überwachung" });
      }
    }

    onConfirm({
      summary:
        summaryBits.length === 0
          ? t.noAccessories
          : `${summaryBits.length} ${pluralize(summaryBits.length, lang, t)}`,
      productListMulti: lines.join(" · "),
      items,
    });
  };

  return (
    <div className="space-y-6">
      {/* Triple-Power-Montagezubehör — wird nur angezeigt, wenn die gewählte
          Batterieserie Holding Bracket + Base Plate tatsächlich braucht.
          IES HS50E-D hat eine eigene Befestigungslösung; dort überspringen. */}
      <section className={seriesUsesMounting ? "" : "hidden"}>
        <div className="flex items-center gap-2 mb-2">
          <Battery className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.forBattery}</h3>
          <span className="text-xs text-muted-foreground">· {t.autoDerived}</span>
        </div>
        {moduleCount > 0 ? (
          <Card className="p-3 text-sm bg-muted/40 border-muted">
            <div className="text-xs text-muted-foreground mb-1">
              {batteryMeta?.seriesLabel} · {moduleCount} {moduleCount === 1 ? t.module : t.modules}
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              <li className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{batteryAcc.brackets}×</span>
                <span>{BATTERY_HOLDING_BRACKET.label}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{batteryAcc.basePlates}×</span>
                <span>{BATTERY_BASE_PLATE.label}</span>
              </li>
            </ul>
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground italic">—</p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.selectDongle}</h3>
          {dongleKey && (
            <button
              type="button"
              onClick={() => setDongleKey(null)}
              className="ml-auto text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> {t.reset}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setDongleKey(null)}
            className={[
              "rounded-lg border-2 px-3 py-3 text-left text-sm transition-colors flex items-center gap-3 min-h-[64px]",
              dongleKey === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted/40">
              <Radio className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-semibold">{t.noDongle}</span>
          </button>
          {SOLAX_DONGLES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDongleKey(d.key)}
              className={[
                "rounded-lg border-2 px-3 py-3 text-left text-sm transition-colors flex items-center gap-3 min-h-[64px]",
                dongleKey === d.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words">{d.label}</div>
                <div className="text-xs text-muted-foreground break-words">{d.productName}</div>
                {d.hint && <div className="text-xs text-primary mt-0.5">{d.hint}</div>}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.others}</h3>
          {otherKeys.size > 0 && (
            <button
              type="button"
              onClick={() => setOtherKeys(new Set())}
              className="ml-auto text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> {t.reset}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SOLAX_OTHER_ACCESSORIES.map((o) => {
            const selected = otherKeys.has(o.key);
            return (
              <button
                key={o.key}
                onClick={() => !o.comingSoon && toggleOther(o.key)}
                disabled={o.comingSoon}
                className={[
                  "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
                  o.comingSoon
                    ? "border-dashed border-border opacity-60 cursor-not-allowed"
                    : selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{o.label}</span>
                  {selected && !o.comingSoon && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">{o.code}</div>
                {o.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{o.description}</div>
                )}
                {o.comingSoon && <div className="text-xs italic mt-0.5">{t.comingSoon}</div>}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.smartMeter}</h3>
          {meterKey && (
            <button
              type="button"
              onClick={() => setMeterKey(null)}
              className="ml-auto text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> {t.reset}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setMeterKey(null)}
            className={[
              "rounded-lg border-2 px-3 py-3 text-left text-sm transition-colors flex items-center gap-3 min-h-[64px]",
              meterKey === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted/40">
              <Gauge className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-semibold">{t.noMeter}</span>
          </button>
          {availableMeters.map((m) => (
            <button
              key={m.key}
              onClick={() => setMeterKey(m.key)}
              className={[
                "rounded-lg border-2 px-3 py-3 text-left text-sm transition-colors flex items-center gap-3 min-h-[64px]",
                meterKey === m.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              {/* Icon-Kachel verhindert Clipping bei langen Produktnamen
                  und gibt der Karte vertikales Gewicht (gleiche min-h für
                  alle Varianten inkl. "Kein Meter"). */}
              <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.phase}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-2 gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          ← {t.back}
        </Button>
        <Button onClick={submit} className="gap-2">
          <Check className="h-4 w-4" />
          {t.confirm}
        </Button>
      </div>
    </div>
  );
}
