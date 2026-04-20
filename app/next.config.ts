import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
