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

interface Props {
  challengeUrl: string;
  lang?: Lang;
  onVerify: (token: string) => void;
}

type WidgetStatus = "loading" | "ready" | "error" | "timeout";

const UI: Record<Lang, { loadError: string; timeout: string; reload: string }> = {
  de: {
    loadError: "Captcha konnte nicht geladen werden.",
    timeout: "Captcha reagiert nicht. Bitte neu laden.",
    reload: "Seite neu laden",
  },
  en: {
    loadError: "Captcha failed to load.",
    timeout: "Captcha is not responding. Please reload.",
    reload: "Reload page",
  },
  cs: {
    loadError: "Captcha se nepodařilo načíst.",
    timeout: "Captcha neodpovídá. Obnovte stránku.",
    reload: "Obnovit stránku",
  },
};

export function AltchaWidget({ challengeUrl, lang = "de", onVerify }: Props) {
  const ref = useRef<HTMLElement & { value?: string }>(null);
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Modul laden — die Registrierung von <altcha-widget> ist ein Seiteneffekt.
  useEffect(() => {
    let cancelled = false;
    import("altcha")
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
  }, []);

  // Event-Listener am Custom-Element. Da der Import asynchron ist, läuft
  // dieser Effect oft vor der Custom-Element-Registrierung — addEventListener
  // auf einem noch nicht upgegradeten HTMLElement ist aber erlaubt, die
  // Listener werden nach dem Upgrade gefeuert.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: Event) => {
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
        onVerify(detail.payload);
      }
    };

    el.addEventListener("statechange", handler);
    return () => el.removeEventListener("statechange", handler);
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
        ROOT CAUSE v2.7.4↓: altcha v3.x hat das Attribut von `challengeurl`
        (v2.x) auf `challenge` umbenannt. Die Prop-Definition in altcha v3
        (dist/main/altcha.js ~Zeile 7037) listet `challenge: { type: "String" }`
        — `challengeurl` wird NICHT observed und ignoriert. Das Widget hat
        deshalb NIE eine Challenge gefetched, NIE verifiziert, und der
        `payload` im statechange-Event blieb null → Submit-Button ewig disabled.
        Das ist der "Captcha funktioniert nicht"-Bug bis v2.7.4.
      */}
      {/* @ts-expect-error — altcha-widget is a custom element not in JSX types */}
      <altcha-widget ref={ref} challenge={challengeUrl} />

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
