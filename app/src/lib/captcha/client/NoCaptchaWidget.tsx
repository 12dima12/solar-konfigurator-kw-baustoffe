"use client";
import { useEffect } from "react";

interface Props {
  onVerify: (token: string) => void;
}

export function NoCaptchaWidget({ onVerify }: Props) {
  useEffect(() => {
    onVerify("no-captcha");
  }, [onVerify]);
  return null;
}
