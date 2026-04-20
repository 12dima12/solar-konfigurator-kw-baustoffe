import { NextResponse } from "next/server";
import { getPublicCaptchaConfig } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getPublicCaptchaConfig());
}
