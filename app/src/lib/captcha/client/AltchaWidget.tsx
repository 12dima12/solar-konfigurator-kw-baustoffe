"use client";
import { useEffect, useRef } from "react";

// altcha is a web component — dynamically imported to avoid SSR issues
interface Props {
  challengeUrl: string;
  onVerify: (token: string) => void;
}

export function AltchaWidget({ challengeUrl, onVerify }: Props) {
  const ref = useRef<HTMLElement & { value?: string }>(null);

  useEffect(() => {
    import("altcha").catch(() => {
      // altcha registers the <altcha-widget> custom element as a side effect
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ payload?: string }>).detail;
      if (detail?.payload) onVerify(detail.payload);
    };

    el.addEventListener("statechange", handler);
    return () => el.removeEventListener("statechange", handler);
  }, [onVerify]);

  // @ts-expect-error — altcha-widget is a custom element not in JSX types
  return <altcha-widget ref={ref} challengeurl={challengeUrl} />;
}
