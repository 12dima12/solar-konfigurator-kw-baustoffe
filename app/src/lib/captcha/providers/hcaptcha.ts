import type { CaptchaProvider, VerifyResult } from "../types";

export const hcaptchaProvider: CaptchaProvider = {
  id: "hcaptcha",

  async verify(token: string, remoteIp?: string): Promise<VerifyResult> {
    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) return { success: false, error: "hcaptcha_not_configured" };
    if (!token) return { success: false, error: "missing_token" };

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const json = await res.json() as { success: boolean };
    return json.success
      ? { success: true }
      : { success: false, error: "captcha_failed" };
  },
};
