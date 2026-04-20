// Use altcha-lib v1 API (simpler HMAC-based PoW, PHP-portable)
import type { CaptchaProvider, VerifyResult } from "../types";
import { createChallenge, verifySolution } from "altcha-lib/v1";

function getHmacKey(): string {
  return process.env.ALTCHA_HMAC_KEY ?? "dev-hmac-key-change-in-production";
}

export async function generateAltchaChallenge(): Promise<object> {
  return createChallenge({ hmacKey: getHmacKey(), maxNumber: 100_000 });
}

export const altchaProvider: CaptchaProvider = {
  id: "altcha",

  async verify(token: string): Promise<VerifyResult> {
    if (!token) return { success: false, error: "missing_token" };

    try {
      const ok = await verifySolution(token, getHmacKey());
      return ok ? { success: true } : { success: false, error: "invalid_solution" };
    } catch {
      return { success: false, error: "verify_error" };
    }
  },
};
