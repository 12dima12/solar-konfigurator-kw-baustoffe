"use client";
import { useEffect } from "react";

const ALLOWED_ORIGINS = [
  "https://www.kw-baustoffe.de",
  "https://kw-baustoffe.de",
  "https://kw-pv-solutions.de",
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:5173"]
    : []),
];

function getTargetOrigin(): string {
  if (typeof document === "undefined") return ALLOWED_ORIGINS[0];

  try {
    const referrer = document.referrer;
    if (!referrer) return ALLOWED_ORIGINS[0];

    const url = new URL(referrer);
    const origin = `${url.protocol}//${url.host}`;

    if (ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }
  } catch {
    // ignore parse errors
  }

  return ALLOWED_ORIGINS[0];
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
      if (!ALLOWED_ORIGINS.includes(e.origin)) return;
      if (e.data === "getHeight") sendHeight();
    };
    window.addEventListener("message", messageHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener("message", messageHandler);
    };
  }, []);
}
