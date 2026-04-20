/**
 * reCAPTCHA v3 — Client-seitige Config
 *
 * Serverseitige Verifikation via google.com/recaptcha ist im
 * WordPress-Plugin implementiert (Phase 10).
 */

import type { CaptchaProvider } from "../types";

export const recaptchaProvider: CaptchaProvider = {
  id: "recaptcha",

  async verify(): Promise<never> {
    throw new Error("Captcha verification happens server-side in the WordPress plugin.");
  },
};
