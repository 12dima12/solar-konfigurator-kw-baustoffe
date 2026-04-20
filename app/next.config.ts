import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async redirects() {
    return [
      { source: "/configurator", destination: "/solax/configurator", permanent: true },
      { source: "/embed", destination: "/solax/embed", permanent: true },
    ];
  },
};

export default nextConfig;
