import { NextResponse } from "next/server";
import { generateAltchaChallenge } from "@/lib/captcha/providers/altcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const challenge = await generateAltchaChallenge();
  return NextResponse.json(challenge);
}
