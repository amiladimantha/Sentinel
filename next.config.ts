import type { NextConfig } from "next";

const turbopackMemoryMb = Number(process.env.SENTINEL_TURBOPACK_MEMORY_MB);

const nextConfig: NextConfig = {
  experimental: {
    // Disable HMR cache for server component fetch responses to prevent
    // memory accumulation from cached RSC payloads during development
    serverComponentsHmrCache: false,
    ...(process.env.SENTINEL_TURBOPACK_RUNTIME === "workerThreads"
      ? { turbopackPluginRuntimeStrategy: "workerThreads" as const }
      : {}),
    ...(Number.isFinite(turbopackMemoryMb) && turbopackMemoryMb > 0
      ? { turbopackMemoryLimit: turbopackMemoryMb * 1024 * 1024 }
      : {}),
  },
};

export default nextConfig;
