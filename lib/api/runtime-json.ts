import { mkdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, dirname, join } from "path";

function getSeedPath(fileName: string) {
  return join(process.cwd(), "data", basename(fileName));
}

function getRuntimePath(fileName: string) {
  const safeFileName = basename(fileName);
  const shouldUseExternalCache =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  if (!process.env.SENTINEL_CACHE_DIR && !shouldUseExternalCache) {
    return getSeedPath(safeFileName);
  }

  const runtimeDir = process.env.SENTINEL_CACHE_DIR ?? join(tmpdir(), "sentinel-runtime-cache");
  return join(/* turbopackIgnore: true */ runtimeDir, safeFileName);
}

function uniquePaths(fileName: string) {
  return Array.from(new Set([getRuntimePath(fileName), getSeedPath(fileName)]));
}

export async function readRuntimeJson<T>(fileName: string): Promise<T | null> {
  for (const filePath of uniquePaths(fileName)) {
    try {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      // Try the next candidate path.
    }
  }

  return null;
}

export async function writeRuntimeJson<T>(fileName: string, data: T): Promise<void> {
  const filePath = getRuntimePath(fileName);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}