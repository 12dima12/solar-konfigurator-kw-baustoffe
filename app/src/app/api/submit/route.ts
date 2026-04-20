import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ConfiguratorPDF } from "@/lib/pdf";
import type { PhaseSelection } from "@/store/configStore";
import type { Lang } from "@/data/types";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyCaptcha } from "@/lib/security/captcha";

const RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 }; // 3 Submits/Stunde/IP

const schema = z.object({
  manufacturer: z.string().regex(/^[a-z0-9-]+$/).default("solax"),
  selections: z.array(
    z.object({
      phase: z.enum(["inverter", "backup", "battery", "wallbox", "accessory", "finish"]),
      steps: z.array(z.string()),
      selectedProduct: z
        .object({
          product_code: z.string().max(100),
          product_name: z.string().max(200),
          value: z.string(),
          image: z.string().nullable().optional(),
        })
        .optional(),
    })
  ).min(1).max(20),
  contact: z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email().max(200).toLowerCase(),
    phone: z.string().max(30).optional(),
    message: z.string().max(2000).optional(),
  }),
  lang: z.enum(["de", "en", "cs"]).default("de"),
  captchaToken: z.string().min(10).optional(),
  website: z.string().max(0).optional(), // honeypot — muss leer sein
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(data: z.infer<typeof schema>): string {
  const products = data.selections.filter((s) => s.selectedProduct);
  const rows = products
    .map(
      (s) => `
      <tr>
        <td style="padding:8px;font-weight:bold;color:#1e3a5f;text-transform:uppercase;font-size:11px;">${escapeHtml(s.phase)}</td>
        <td style="padding:8px;">
          <strong>${escapeHtml(s.selectedProduct!.value)}</strong><br/>
          <small style="color:#666;">${escapeHtml(s.selectedProduct!.product_name)}</small><br/>
          <code style="font-size:11px;color:#888;">${escapeHtml(s.selectedProduct!.product_code)}</code>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">Neue PV-Konfiguration</h1>
        <p style="color:#90b4d8;margin:4px 0 0;">KW PV Solutions Konfigurator · ${escapeHtml(data.manufacturer)}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <h2 style="color:#1e3a5f;font-size:14px;margin-bottom:12px;">Kontakt</h2>
        <p><strong>${escapeHtml(data.contact.name)}</strong><br/>
        ${escapeHtml(data.contact.email)}${data.contact.phone ? `<br/>${escapeHtml(data.contact.phone)}` : ""}
        ${data.contact.message ? `<br/><em>${escapeHtml(data.contact.message)}</em>` : ""}</p>
        <h2 style="color:#1e3a5f;font-size:14px;margin-top:20px;margin-bottom:12px;">Ausgewählte Komponenten</h2>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;">
          ${rows}
        </table>
        <p style="margin-top:20px;font-size:12px;color:#9ca3af;">
          Kunden-Nr. 108204 · KW Baustoffe GmbH · Drensteinfurt
        </p>
      </div>
    </div>`;
}

async function generatePdf(data: z.infer<typeof schema>): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(ConfiguratorPDF as any, {
    selections: data.selections as PhaseSelection[],
    contact: data.contact,
    lang: data.lang as Lang,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

async function sendEmail(data: z.infer<typeof schema>, pdfBuffer: Buffer): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[submit] RESEND_API_KEY not set — skipping email");
    return;
  }

  const salesEmail = process.env.SALES_EMAIL ?? "vertrieb@kw-baustoffe.de";
  const fromEmail = process.env.FROM_EMAIL ?? "konfigurator@kw-baustoffe.de";
  const html = buildEmailHtml(data);

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromEmail,
      to: salesEmail,
      subject: `Neue PV-Konfiguration: ${data.contact.name} (${new Date().toLocaleDateString("de-DE")})`,
      html,
      attachments: [{ filename: "kw-pv-konfiguration.pdf", content: pdfBuffer.toString("base64") }],
    }),
  });

  if (data.contact.email) {
    const confirmHtml = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Ihre PV-Konfiguration</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Sehr geehrte/r ${escapeHtml(data.contact.name)},</p>
          <p>vielen Dank für Ihre Konfiguration. Wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.</p>
          <p>Im Anhang finden Sie eine Zusammenfassung Ihrer Komponentenauswahl als PDF.</p>
          <p>Mit freundlichen Grüßen,<br/><strong>KW PV Solutions</strong><br/>KW Baustoffe GmbH · Drensteinfurt</p>
        </div>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: data.contact.email,
        subject: "Ihre PV-Konfiguration bei KW PV Solutions",
        html: confirmHtml,
        attachments: [{ filename: "kw-pv-konfiguration.pdf", content: pdfBuffer.toString("base64") }],
      }),
    });
  }
}

export async function POST(req: Request) {
  try {
    // Rate-Limit
    const ip = getClientIp(req);
    const rl = checkRateLimit(`submit:${ip}`, RATE_LIMIT);
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const data = schema.parse(body);

    // Honeypot check
    if (data.website) {
      return Response.json({ success: true, id: crypto.randomUUID() });
    }

    // Captcha verify
    if (data.captchaToken) {
      const captchaOk = await verifyCaptcha(data.captchaToken);
      if (!captchaOk) {
        return Response.json({ error: "Captcha verification failed" }, { status: 403 });
      }
    }

    const pdfBuffer = await generatePdf(data);
    await sendEmail(data, pdfBuffer);

    console.log(`[submit] ${data.contact.name} <${data.contact.email}> — ${data.selections.filter((s) => s.selectedProduct).length} products`);

    return Response.json({ success: true, id: crypto.randomUUID() });
  } catch (err) {
    console.error("[submit] error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 400 });
  }
}
