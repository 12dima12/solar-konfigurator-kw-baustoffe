import { redirect } from "next/navigation";

// Legacy route — redirected to /solax/embed via next.config.ts redirects.
// This file is kept as a fallback for any direct SSR hits.
export default function EmbedPage() {
  redirect("/solax/embed");
}
