import type { CaptchaProvider } from "../types";

export const noneProvider: CaptchaProvider = {
  id: "none",
  async verify(): Promise<{ success: true }> {
    return { success: true };
  },
};
