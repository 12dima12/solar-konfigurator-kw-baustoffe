import type { CaptchaProvider, VerifyResult } from "../types";

export const recaptchaProvider: CaptchaProvider = {
  id: "recaptcha",

  async verify(token: string, remoteIp?: string): Promise<VerifyResult> {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return { success: false, error: "recaptcha_not_configured" };
    if (!token) return { success: false, error: "missing_token" };

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const json = await res.json() as { success: boolean; score?: number };
    // v3: require score >= 0.5
    const ok = json.success && (json.score === undefined || json.score >= 0.5);
    return ok
      ? { success: true }
      : { success: false, error: "captcha_failed" };
  },
};
