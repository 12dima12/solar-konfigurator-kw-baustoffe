"use client";
import { useEffect, useState } from "react";
import type { PublicCaptchaConfig } from "../types";
import type { Lang } from "@/data/types";
import { route, getApiHeaders } from "@/config/api";
import { AltchaWidget } from "./AltchaWidget";
import { NoCaptchaWidget } from "./NoCaptchaWidget";

interface Props {
  lang?: Lang;
  onVerify: (token: string) => void;
}

type ConfigState =
  | { phase: "loading" }
  | { phase: "ready"; config: PublicCaptchaConfig }
  | { phase: "error"; message: string };

const UI: Record<Lang, { fetchError: string; retry: string }> = {
  de: { fetchError: "Captcha-Konfiguration konnte nicht geladen werden.", retry: "Erneut versuchen" },
  en: { fetchError: "Failed to load captcha configuration.", retry: "Retry" },
  cs: { fetchError: "Konfiguraci captcha se nepodařilo načíst.", retry: "Zkusit znovu" },
};

export function CaptchaWidget({ lang = "de", onVerify }: Props) {
  const [state, setState] = useState<ConfigState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(route("captchaConfig"), { headers: getApiHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as PublicCaptchaConfig;
      })
      .then((config) => {
        if (!cancelled) setState({ phase: "ready", config });
      })
      .catch((err) => {
        console.error("[captcha] config fetch failed:", err);
        if (!cancelled) {
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const t = UI[lang] ?? UI.de;

  if (state.phase === "loading") return null;

  if (state.phase === "error") {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <p className="font-medium">{t.fetchError}</p>
        <p className="opacity-70 mt-0.5">{state.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="underline mt-1 hover:opacity-80"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  switch (state.config.provider) {
    case "altcha":
      return (
        <AltchaWidget
          challengeUrl={state.config.challengeUrl!}
          lang={lang}
          onVerify={onVerify}
        />
      );
    case "none":
      return <NoCaptchaWidget onVerify={onVerify} />;
  }
}
