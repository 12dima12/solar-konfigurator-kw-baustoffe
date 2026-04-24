"use client";
import Image from "next/image";
import { publicAsset } from "@/lib/public-asset";
import type { Lang } from "@/data/types";
import type { InstallationType } from "@/store/configStore";

interface Props {
  lang: Lang;
  onPick: (t: InstallationType) => void;
}

const UI = {
  de: {
    title: "Installationsart",
    new: "Neuinstallation",
    newHint: "Neue PV-Anlage inkl. Wechselrichter + Speicher",
    ac: "AC-Kopplung",
    acHint: "Speicher-Nachrüstung für bestehende PV-Anlage",
  },
  en: {
    title: "Installation type",
    new: "New installation",
    newHint: "New PV system incl. inverter and battery",
    ac: "AC Coupling",
    acHint: "Retrofit battery for existing PV system",
  },
  cs: {
    title: "Typ instalace",
    new: "Nová instalace",
    newHint: "Nový PV systém vč. střídače a baterie",
    ac: "AC Coupling",
    acHint: "Dovybavení baterie pro stávající PV systém",
  },
} as const;

export function InstallationTypePicker({ lang, onPick }: Props) {
  const t = UI[lang];
  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-6">{t.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onPick("new")}
          className="group relative rounded-xl border-2 border-border hover:border-primary overflow-hidden cursor-pointer transition-all hover:shadow-md h-48"
        >
          <Image
            src={publicAsset("/products/media/cover-split-home.jpg")}
            alt={t.new}
            fill
            className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-4 text-white">
            <div className="font-bold text-lg">{t.new}</div>
            <div className="text-xs text-white/90">{t.newHint}</div>
          </div>
        </button>
        <button
          onClick={() => onPick("ac-coupling")}
          className="group relative rounded-xl border-2 border-border hover:border-primary overflow-hidden cursor-pointer transition-all hover:shadow-md h-48"
        >
          <Image
            src={publicAsset("/products/media/cover-ies-home.jpg")}
            alt={t.ac}
            fill
            className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-4 text-white">
            <div className="font-bold text-lg">{t.ac}</div>
            <div className="text-xs text-white/90">{t.acHint}</div>
          </div>
        </button>
      </div>
    </div>
  );
}
