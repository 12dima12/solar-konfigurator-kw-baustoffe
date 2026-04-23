import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML/CSS/JS export — the plugin serves the `out/` directory.
  output: "export",
  // Prefix for all /_next/ asset URLs so the Turbopack/webpack runtime
  // requests chunks from the correct path under wp-content/plugins/…
  // Set via NEXT_PUBLIC_ASSET_PREFIX at build time (see sync-konfigurator.sh).
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || "",
  // The `<img src>` loader is replaced by raw paths; next/image optimization
  // is a server-time feature that static export can't provide.
  images: {
    unoptimized: true,
  },
  // Produce `solax/configurator/index.html` instead of `solax/configurator.html`
  // so the plugin's manifest lookup points at a directory.
  trailingSlash: true,
  // Cap static-export worker pool to 1 — OpenVZ container has a hard
  // numproc=1100 limit and the default of 4+ jest-workers triggers EAGAIN
  // on `spawn` during "Collecting page data". Slower build, same output.
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
