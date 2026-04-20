export type CaptchaProviderId = "altcha" | "hcaptcha" | "recaptcha" | "none";

export interface VerifyResult {
  success: boolean;
  error?: string;
}

export interface CaptchaProvider {
  id: CaptchaProviderId;
  verify(token: string, remoteIp?: string): Promise<VerifyResult>;
}

export interface PublicCaptchaConfig {
  provider: CaptchaProviderId;
  /** Only set for altcha: the challenge URL the widget must call */
  challengeUrl?: string;
  /** Only set for hcaptcha/recaptcha: the public site key */
  siteKey?: string;
}
