/**
 * Altcha — Client-seitige Config
 *
 * Serverseitige Challenge-Generierung und verify() sind im
 * WordPress-Plugin implementiert (Phase 10).
 * Siehe: kw-pv-tools/includes/class-captcha.php
 */

import type { CaptchaProvider } from "../types";

export const altchaProvider: CaptchaProvider = {
  id: "altcha",

  async verify(): Promise<never> {
    throw new Error("Captcha verification happens server-side in the WordPress plugin.");
  },
};
