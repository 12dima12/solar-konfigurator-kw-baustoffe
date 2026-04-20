/**
 * hCaptcha — Client-seitige Config
 *
 * Serverseitige Verifikation via hcaptcha.com/siteverify ist im
 * WordPress-Plugin implementiert (Phase 10).
 */

import type { CaptchaProvider } from "../types";

export const hcaptchaProvider: CaptchaProvider = {
  id: "hcaptcha",

  async verify(): Promise<never> {
    throw new Error("Captcha verification happens server-side in the WordPress plugin.");
  },
};
