"use client";
import { useEffect, useState } from "react";
import type { PublicCaptchaConfig } from "../types";
import { route, getApiHeaders } from "@/config/api";
import { AltchaWidget } from "./AltchaWidget";
import { NoCaptchaWidget } from "./NoCaptchaWidget";

interface Props {
  onVerify: (token: string) => void;
}

export function CaptchaWidget({ onVerify }: Props) {
  const [config, setConfig] = useState<PublicCaptchaConfig | null>(null);

  useEffect(() => {
    fetch(route("captchaConfig"), { headers: getApiHeaders() })
      .then((r) => r.json() as Promise<PublicCaptchaConfig>)
      .then(setConfig)
      .catch(() => setConfig({ provider: "none" }));
  }, []);

  if (!config) return null;

  switch (config.provider) {
    case "altcha":
      return <AltchaWidget challengeUrl={config.challengeUrl!} onVerify={onVerify} />;
    case "none":
      return <NoCaptchaWidget onVerify={onVerify} />;
  }
}
