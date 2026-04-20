import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ConfiguratorPDF } from "@/lib/pdf";
import type { PhaseSelection } from "@/store/configStore";
import type { Lang } from "@/data/types";

const schema = z.object({
  manufacturer: z.string().default("solax"),
  selections: z.array(
    z.object({
      phase: z.string(),
      steps: z.array(z.string()),
      selectedProduct: z
        .object({
          product_code: z.string(),
          product_name: z.string(),
          value: z.string(),
          image: z.string().nullable().optional(),
        })
        .optional(),
    })
  ),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string().optional(),
  }),
  lang: z.string().default("de"),
});

function buildEmailHtml(data: z.infer<typeof schema>): string {
  const products = data.selections.filter((s) => s.selectedProduct);
  const rows = products
    .map(
      (s) => `
      <tr>
        <td style="padding:8px;font-weight:bold;color:#1e3a5f;text-transform:uppercase;font-size:11px;">${s.phase}</td>
        <td style="padding:8px;">
          <strong>${s.selectedProduct!.value}</strong><br/>
          <small style="color:#666;">${s.selectedProduct!.product_name}</small><br/>
          <code style="font-size:11px;color:#888;">${s.selectedProduct!.product_code}</code>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">Neue PV-Konfiguration</h1>
        <p style="color:#90b4d8;margin:4px 0 0;">KW PV Solutions Konfigurator</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <h2 style="color:#1e3a5f;font-size:14px;margin-bottom:12px;">Kontakt</h2>
        <p><strong>${data.contact.name}</strong><br/>
        ${data.contact.email}${data.contact.phone ? `<br/>${data.contact.phone}` : ""}
        ${data.contact.message ? `<br/><em>${data.contact.message}</em>` : ""}</p>
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

  const payload = {
    from: fromEmail,
    to: salesEmail,
    subject: `Neue PV-Konfiguration: ${data.contact.name} (${new Date().toLocaleDateString("de-DE")})`,
    html,
    attachments: [
      {
        filename: "kw-pv-konfiguration.pdf",
        content: pdfBuffer.toString("base64"),
      },
    ],
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  // Kunden-Bestätigung
  if (data.contact.email) {
    const confirmHtml = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Ihre PV-Konfiguration</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Sehr geehrte/r ${data.contact.name},</p>
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
    const body = await req.json();
    const data = schema.parse(body);

    const pdfBuffer = await generatePdf(data);
    await sendEmail(data, pdfBuffer);

    console.log(`[submit] ${data.contact.name} <${data.contact.email}> — ${data.selections.filter((s) => s.selectedProduct).length} products`);

    return Response.json({ success: true, id: crypto.randomUUID() });
  } catch (err) {
    console.error("[submit] error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 400 });
  }
}
