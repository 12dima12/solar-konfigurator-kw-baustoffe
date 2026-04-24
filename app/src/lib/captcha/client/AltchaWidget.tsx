"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/data/types";

// altcha ist ein Web-Component — dynamischer Import vermeidet SSR-Probleme.
// Die Wrapper-Komponente übernimmt drei Aufgaben:
//   1. Import-Fehler sichtbar machen (statt silent catch → User sieht leeres
//      Feld ohne zu wissen, warum der Submit-Button disabled bleibt).
//   2. Timeout: falls das Widget nach 10 s keinen statechange emittiert
//      (z.B. Challenge-Endpoint down, Crypto-Subtle blockiert, Module fehlt),
//      zeigen wir einen Hinweis mit Reload-Button.
//   3. State-Tracing in der Browser-Konsole, wenn NODE_ENV !== production —
//      ermöglicht Diagnose ohne zweiten Build.
//
// Dokumentationsquelle: node_modules/altcha/README.md (v3). Key-Facts:
//   - `challenge` als Attribut (URL oder Challenge-Objekt als JSON-String)
//   - `language` als Attribut für UI-Texte; erfordert den passenden Import
//     `altcha/i18n/<lang>` damit die Übersetzung registriert ist
//   - Events: statechange (→ setState), verified (→ payload garantiert),
//     expired (→ payload invalid), load (→ Widget bereit)
//   - State-Enum: unverified | verifying | verified | error | expired | code
//   - Default `type="checkbox"`, Default `auto="off"` — User klickt aktiv.

interface Props {
  challengeUrl: string;
  lang?: Lang;
  onVerify: (token: string) => void;
}

type WidgetStatus = "loading" | "ready" | "error" | "timeout";

const UI: Record<Lang, { loadError: string; timeout: string; reload: string; expired: string }> = {
  de: {
    loadError: "Captcha konnte nicht geladen werden.",
    timeout: "Captcha reagiert nicht. Bitte neu laden.",
    reload: "Seite neu laden",
    expired: "Captcha abgelaufen — bitte erneut bestätigen.",
  },
  en: {
    loadError: "Captcha failed to load.",
    timeout: "Captcha is not responding. Please reload.",
    reload: "Reload page",
    expired: "Captcha expired — please verify again.",
  },
  cs: {
    loadError: "Captcha se nepodařilo načíst.",
    timeout: "Captcha neodpovídá. Obnovte stránku.",
    reload: "Obnovit stránku",
    expired: "Platnost captcha vypršela — ověřte znovu.",
  },
};

export function AltchaWidget({ challengeUrl, lang = "de", onVerify }: Props) {
  const ref = useRef<HTMLElement & { value?: string }>(null);
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // Laut altcha-Readme muss VOR dem Widget-Import die passende i18n-Datei
  // gezogen werden, sonst bleibt der Widget-Text in der Fallback-Sprache.
  // Zwei voneinander unabhängige dynamische Imports (bundler-code-split).
  useEffect(() => {
    let cancelled = false;
    const i18nPromise =
      lang === "de"
        ? import("altcha/i18n/de")
        : lang === "cs"
          ? import("altcha/i18n/cs")
          : import("altcha/i18n/en");

    Promise.all([i18nPromise.catch(() => undefined), import("altcha")])
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err) => {
        console.error("[captcha] altcha module failed to load:", err);
        if (!cancelled) {
          setStatus("error");
          setErrorDetail(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Event-Listener am Custom-Element. Der addEventListener funktioniert auch
  // dann, wenn das Element noch nicht vom customElements-Registry upgegradet
  // wurde — Listener bleiben erhalten und feuern nach dem Upgrade.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStateChange = (e: Event) => {
      const detail = (e as CustomEvent<{ state?: string; payload?: string }>).detail;
      if (process.env.NODE_ENV !== "production") {
        console.log("[captcha] statechange", detail);
      }
      if (detail?.state === "error") {
        setStatus("error");
        setErrorDetail("widget reported error state");
        return;
      }
      if (detail?.payload) {
        setExpired(false);
        onVerify(detail.payload);
      }
    };

    const onExpired = () => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[captcha] expired");
      }
      setExpired(true);
      onVerify(""); // parent entdeckt leeren Token und sperrt Submit wieder
    };

    el.addEventListener("statechange", onStateChange);
    el.addEventListener("expired", onExpired);
    return () => {
      el.removeEventListener("statechange", onStateChange);
      el.removeEventListener("expired", onExpired);
    };
  }, [onVerify]);

  // Timeout: wenn das Widget nicht innerhalb 10 s lädt, wechseln wir in den
  // Timeout-Zustand. Das hilft bei Offline-Browser, geblockten CDN-Chunks
  // oder kaputten Bundle-Hashes.
  useEffect(() => {
    if (status !== "loading") return;
    const t = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "timeout" : s));
    }, 10_000);
    return () => window.clearTimeout(t);
  }, [status]);

  const t = UI[lang] ?? UI.de;

  return (
    <div className="space-y-2">
      {/*
        altcha v3 liest das Attribut `challenge` (URL oder Challenge-Objekt).
        In altcha v2 hieß es `challengeurl` — unser Wrapper setzte bis v2.7.4
        das alte Attribut, das v3 ignoriert → ab v2.7.5 korrekt auf
        `challenge` umgestellt. `language` propagiert das UI auf die gewählte
        Sprache; die zugehörige i18n-Bundle wird im Effect oben dazu-
        geimportet. `name` und `type` bleiben bei den Defaults ("altcha" bzw.
        "checkbox").
      */}
      {/* @ts-expect-error — altcha-widget is a custom element; altcha ships JSX types at altcha/dist/types/react.d.ts but the path is not in our exports map. */}
      <altcha-widget ref={ref} challenge={challengeUrl} language={lang} />

      {expired && status !== "error" && status !== "timeout" && (
        <p className="text-xs text-amber-800">{t.expired}</p>
      )}

      {status === "error" && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <p className="font-medium">{t.loadError}</p>
          {errorDetail && <p className="opacity-70 mt-0.5">{errorDetail}</p>}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline mt-1 hover:opacity-80"
          >
            {t.reload}
          </button>
        </div>
      )}

      {status === "timeout" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-medium">{t.timeout}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline mt-1 hover:opacity-80"
          >
            {t.reload}
          </button>
        </div>
      )}
    </div>
  );
}
