"use client";
import { useEffect } from "react";

export function useIframeResize() {
  useEffect(() => {
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: "kw-configurator-resize", height }, "*");
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    const handler = (e: MessageEvent) => {
      if (e.data === "getHeight") sendHeight();
    };
    window.addEventListener("message", handler);

    return () => {
      observer.disconnect();
      window.removeEventListener("message", handler);
    };
  }, []);
}
