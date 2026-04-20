"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfigStore } from "@/store/configStore";
import type { Lang } from "@/data/types";

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "cs", label: "Čeština", flag: "🇨🇿" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useConfigStore();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger className="w-[120px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.value} value={l.value} className="text-xs">
            {l.flag} {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
