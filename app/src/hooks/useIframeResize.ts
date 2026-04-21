"use client";
import { useEffect } from "react";

// Fallback falls document.referrer nicht verfügbar ist (z.B. bei strikter
// Referrer-Policy des Parent). Wird nur als initiales Ziel genutzt; sobald
// der Parent antwortet wird seine Origin übernommen.
const FALLBACK_ORIGIN = "https://www.kw-baustoffe.de";

function getTargetOrigin(): string {
  if (typeof document === "undefined") return FALLBACK_ORIGIN;

  // Gleiche Origin wie die Seite, die uns einbettet — steht im Referrer.
  // Kein Whitelist-Check: der Plugin-Admin entscheidet, auf welchen Seiten
  // der iframe eingebettet wird (über den WP-Shortcode). Die Nachrichten
  // enthalten nur numerische Höhe, kein Exfiltrations-Risiko.
  try {
    const referrer = document.referrer;
    if (referrer) {
      const url = new URL(referrer);
      return `${url.protocol}//${url.host}`;
    }
  } catch {
    // ignore parse errors
  }
  return FALLBACK_ORIGIN;
}

export function useIframeResize() {
  useEffect(() => {
    const targetOrigin = getTargetOrigin();

    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage(
        { type: "kw-configurator-resize", height },
        targetOrigin
      );
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    const messageHandler = (e: MessageEvent) => {
      // Nur der Parent-Window darf anfragen. Cross-frame-Messages aus
      // anderen iframes werden ignoriert — Origin-Check über die Source.
      if (e.source !== window.parent) return;
      if (e.data === "getHeight") sendHeight();
    };
    window.addEventListener("message", messageHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener("message", messageHandler);
    };
  }, []);
}
