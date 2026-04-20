import { redirect } from "next/navigation";
import { listManufacturers } from "@/manufacturers";

export default function Home() {
  const manufacturers = listManufacturers();

  // Single manufacturer: redirect directly to configurator
  if (manufacturers.length === 1) {
    redirect(`/${manufacturers[0].meta.slug}/configurator`);
  }

  // Multiple manufacturers: show picker
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-2xl font-bold text-primary text-center">PV-Konfigurator wählen</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {manufacturers.map((m) => (
            <a
              key={m.meta.slug}
              href={`/${m.meta.slug}/configurator`}
              className="rounded-xl border-2 border-border hover:border-primary p-6 text-center font-semibold transition-all hover:shadow-md bg-card"
            >
              {m.meta.displayName}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
