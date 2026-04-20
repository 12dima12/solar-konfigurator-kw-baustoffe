"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfigStore } from "@/store/configStore";
import { useManufacturer } from "@/lib/manufacturer-context";
import { PHASE_LABELS } from "@/lib/constants";
import type { Lang } from "@/data/types";
import { CheckCircle, RotateCcw } from "lucide-react";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  website: z.string().optional(), // honeypot
});
type FormData = z.infer<typeof schema>;

const UI: Record<Lang, { title: string; submit: string; success: string; reset: string; name: string; email: string; phone: string; message: string; captchaHint: string }> = {
  de: { title: "Ihre Konfiguration", submit: "Zur Anfrage", success: "Anfrage gesendet! Wir melden uns bei Ihnen.", reset: "Neue Konfiguration", name: "Name", email: "E-Mail", phone: "Telefon (optional)", message: "Nachricht (optional)", captchaHint: "Dieser Bereich ist durch hCaptcha geschützt." },
  en: { title: "Your Configuration", submit: "Send Request", success: "Request sent! We will contact you.", reset: "New Configuration", name: "Name", email: "Email", phone: "Phone (optional)", message: "Message (optional)", captchaHint: "This area is protected by hCaptcha." },
  cs: { title: "Vaše konfigurace", submit: "Odeslat poptávku", success: "Poptávka odeslána! Ozveme se vám.", reset: "Nová konfigurace", name: "Jméno", email: "E-mail", phone: "Telefon (volitelné)", message: "Zpráva (volitelné)", captchaHint: "Tato oblast je chráněna hCaptcha." },
};

export function SubmitSummary() {
  const { selections, lang, reset } = useConfigStore();
  const manufacturer = useManufacturer();
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const t = UI[lang] ?? UI.de;
  const filled = selections.filter((s) => s.selectedProduct);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Honeypot check (client-side guard — server also checks)
    if (data.website) return;

    if (!captchaToken) {
      alert(t.captchaHint);
      return;
    }

    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manufacturer: manufacturer.meta.slug,
        selections: filled,
        contact: { name: data.name, email: data.email, phone: data.phone, message: data.message },
        lang,
        captchaToken,
      }),
    });

    captchaRef.current?.resetCaptcha();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-12">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <p className="text-lg font-semibold text-primary">{t.success}</p>
        <Button variant="outline" onClick={reset} className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t.reset}
        </Button>
      </div>
    );
  }

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">{t.title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filled.map((s) => (
          <Card key={s.phase} className="p-4 flex items-center gap-3">
            {s.selectedProduct?.image && (
              <Image
                src={`/products/${s.selectedProduct.image.replace("img/", "")}`}
                alt={s.selectedProduct.value}
                width={56}
                height={56}
                className="object-contain shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase">{PHASE_LABELS[s.phase][lang]}</p>
              <p className="font-semibold text-sm">{s.selectedProduct?.value}</p>
              <p className="text-xs font-mono text-muted-foreground">{s.selectedProduct?.product_code}</p>
            </div>
          </Card>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-6">
        {/* Honeypot — unsichtbar für echte User, Bots füllen es aus */}
        <input
          {...register("website")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.name} *</label>
            <input {...register("name")} className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.email} *</label>
            <input {...register("email")} type="email" className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.phone}</label>
            <input {...register("phone")} type="tel" className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t.message}</label>
          <textarea {...register("message")} rows={3} className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none" />
        </div>

        {siteKey && (
          <div className="space-y-1">
            <HCaptcha
              ref={captchaRef}
              sitekey={siteKey}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
            />
            <p className="text-xs text-muted-foreground">
              {t.captchaHint}{" "}
              <a href="/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</a>
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || (!!siteKey && !captchaToken)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {t.submit}
        </Button>
      </form>
    </div>
  );
}
