"use client";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface Props {
  siteKey: string;
  onVerify: (token: string) => void;
}

export function HCaptchaWidget({ siteKey, onVerify }: Props) {
  return <HCaptcha sitekey={siteKey} onVerify={onVerify} />;
}
