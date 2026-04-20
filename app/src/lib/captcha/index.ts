import type { CaptchaProvider, CaptchaProviderId, PublicCaptchaConfig } from "./types";
import { altchaProvider } from "./providers/altcha";
import { hcaptchaProvider } from "./providers/hcaptcha";
import { recaptchaProvider } from "./providers/recaptcha";
import { noneProvider } from "./providers/none";

const PROVIDERS: Record<CaptchaProviderId, CaptchaProvider> = {
  altcha: altchaProvider,
  hcaptcha: hcaptchaProvider,
  recaptcha: recaptchaProvider,
  none: noneProvider,
};

export function getActiveCaptchaProvider(): CaptchaProvider {
  const id = (process.env.CAPTCHA_PROVIDER ?? "altcha") as CaptchaProviderId;
  return PROVIDERS[id] ?? altchaProvider;
}

export function getPublicCaptchaConfig(): PublicCaptchaConfig {
  const provider = getActiveCaptchaProvider();

  switch (provider.id) {
    case "altcha":
      return {
        provider: "altcha",
        challengeUrl: "/api/captcha/altcha/challenge",
      };
    case "hcaptcha":
      return {
        provider: "hcaptcha",
        siteKey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "",
      };
    case "recaptcha":
      return {
        provider: "recaptcha",
        siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "",
      };
    case "none":
      return { provider: "none" };
  }
}

export type { CaptchaProvider, CaptchaProviderId, PublicCaptchaConfig, VerifyResult } from "./types";
