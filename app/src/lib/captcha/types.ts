export type CaptchaProviderId = "altcha" | "none";

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
}
