"use client";
import { useEffect } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface InnerProps {
  onVerify: (token: string) => void;
}

function RecaptchaInner({ onVerify }: InnerProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (!executeRecaptcha) return;
    executeRecaptcha("submit").then(onVerify).catch(() => {
      // silent — submit handler will catch missing token
    });
  }, [executeRecaptcha, onVerify]);

  return null;
}

interface Props {
  siteKey: string;
  onVerify: (token: string) => void;
}

export function RecaptchaWidget({ siteKey, onVerify }: Props) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <RecaptchaInner onVerify={onVerify} />
    </GoogleReCaptchaProvider>
  );
}
