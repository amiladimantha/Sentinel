import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable HMR cache for server component fetch responses to prevent
    // memory accumulation from cached RSC payloads during development
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
