"use client";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    document.cookie = `kw_auth=${encodeURIComponent(password)}; path=/; max-age=86400; SameSite=Lax`;
    // Redirect und prüfen ob Middleware durchlässt
    router.push(from);
    setTimeout(() => {
      if (window.location.pathname === "/_login") {
        setError(true);
        document.cookie = "kw_auth=; path=/; max-age=0";
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image src="/kw-logo.svg" alt="KW PV Solutions" width={160} height={36} className="mx-auto" />
          <p className="text-sm text-gray-500">PV-Konfigurator · Zugang</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">Falsches Passwort. Bitte erneut versuchen.</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#162d4a] transition-colors"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
