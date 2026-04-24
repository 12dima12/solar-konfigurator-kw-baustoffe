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
  // Cap static-export worker pool only when NEXT_BUILD_CPUS is set —
  // der Build-Container (OpenVZ, numproc=1100) braucht `cpus: 1` damit
  // "Collecting page data" nicht an EAGAIN beim `spawn` scheitert. Auf
  // Entwickler-Maschinen ohne numproc-Limit bleibt der Default (4+) aktiv
  // und der Build parallelisiert wie gewohnt. Setzen via
  //   NEXT_BUILD_CPUS=1 pnpm build
  experimental: {
    ...(process.env.NEXT_BUILD_CPUS
      ? { cpus: Number(process.env.NEXT_BUILD_CPUS) }
      : {}),
  },
};

export default nextConfig;
