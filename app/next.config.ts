import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML/CSS/JS export — the plugin serves the `out/` directory.
  output: "export",
  // The `<img src>` loader is replaced by raw paths; next/image optimization
  // is a server-time feature that static export can't provide.
  images: {
    unoptimized: true,
  },
  // Produce `solax/configurator/index.html` instead of `solax/configurator.html`
  // so the plugin's manifest lookup points at a directory.
  trailingSlash: true,
};

export default nextConfig;
