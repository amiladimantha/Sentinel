import { dedupeInFlight } from "@/lib/api/dedupe";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/api/runtime-json";
import type { FuelPrice } from "@/lib/types";

const CEYPETCO_URL = "https://ceypetco.gov.lk/marketing-sales/";
const DATA_FILE = "fuel-prices.json";

/** Map Ceypetco fuel names to our standard types */
const FUEL_NAME_MAP: Record<string, FuelPrice["fuelType"]> = {
  "Lanka Petrol 92 Octane": "Petrol 92",
  "Lanka Petrol 95 Octane Euro 4": "Petrol 95",
  "Lanka Auto Diesel": "Auto Diesel",
  "Lanka Super Diesel 4 Star Euro 4": "Super Diesel",
};

interface StoredFuelData {
  prices: Record<string, number>; // key: "fuelType|provider" → price
  history: Record<string, { date: string; price: number }[]>; // key: "fuelType|provider" → daily snapshots
  lastUpdated: string;
}

async function readStoredPrices(): Promise<StoredFuelData> {
  const parsed = await readRuntimeJson<Partial<StoredFuelData>>(DATA_FILE);
  if (!parsed) {
    return { prices: {}, history: {}, lastUpdated: "" };
  }

  return {
    prices: parsed.prices ?? {},
    history: parsed.history ?? {},
    lastUpdated: parsed.lastUpdated ?? "",
  };
}

async function writeStoredPrices(data: StoredFuelData): Promise<void> {
  try {
    await writeRuntimeJson(DATA_FILE, data);
  } catch {
    // non-critical, ignore write errors
  }
}

/**
 * Fetch current fuel prices by scraping ceypetco.gov.lk/marketing-sales/.
 * Only Ceypetco prices are shown (LIOC prices are not publicly accessible).
 * Compares with stored JSON to compute price differences.
 */
export function getFuelPrices(): Promise<FuelPrice[]> {
  return dedupeInFlight("fuel-prices", getFuelPricesFresh);
}

async function getFuelPricesFresh(): Promise<FuelPrice[]> {
  try {
    const res = await fetch(CEYPETCO_URL, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const html = await res.text();
    const prices: FuelPrice[] = [];

    // Extract effective date
    const dateMatch = html.match(/Effect from:\s*([\d-]+)/i);
    const effectiveDate = dateMatch ? parseEffectiveDate(dateMatch[1]) : new Date().toISOString();

    // Parse price cards: <h3 class="fuel-name">NAME</h3> ... Rs.PRICE
    const cardPattern =
      /<h3 class="fuel-name">([^<]+)<\/h3>[\s\S]*?<span class="price-currency">Rs\.<\/span>\s*([\d,.]+)/gi;

    const stored = await readStoredPrices();
    const newPrices: Record<string, number> = {};
    const newHistory: Record<string, { date: string; price: number }[]> = { ...stored.history };
    const today = new Date().toISOString().slice(0, 10);
    let hasChanged = false;

    let match: RegExpExecArray | null;
    while ((match = cardPattern.exec(html)) !== null) {
      const rawName = match[1].trim();
      const fuelType = FUEL_NAME_MAP[rawName];
      if (!fuelType) continue;

      const price = parseFloat(match[2].replace(/,/g, ""));
      if (isNaN(price)) continue;

      // Helper to append to history (capped at 30 days, one entry per day)
      const appendHistory = (key: string, p: number) => {
        const hist = newHistory[key] ?? [];
        const lastEntry = hist[hist.length - 1];
        if (!lastEntry || lastEntry.date !== today) {
          hist.push({ date: today, price: p });
        } else {
          lastEntry.price = p; // update today's entry
        }
        newHistory[key] = hist.slice(-30);
      };

      // Ceypetco entry
      const ceypetcoKey = `${fuelType}|Ceypetco`;
      const prevCeypetco = stored.prices[ceypetcoKey] ?? price;
      newPrices[ceypetcoKey] = price;
      if (price !== prevCeypetco) hasChanged = true;
      appendHistory(ceypetcoKey, price);

      prices.push({
        fuelType,
        provider: "Ceypetco",
        price,
        previousPrice: prevCeypetco,
        unit: "LKR/L",
        lastUpdated: effectiveDate,
        history: newHistory[ceypetcoKey] ?? [],
      });
    }

    // Persist new prices if they changed or first run
    if (prices.length > 0 && (hasChanged || !stored.lastUpdated)) {
      await writeStoredPrices({ prices: newPrices, history: newHistory, lastUpdated: effectiveDate });
    } else if (prices.length > 0) {
      // Always write history (daily snapshot may be new)
      await writeStoredPrices({ prices: newPrices, history: newHistory, lastUpdated: stored.lastUpdated });
    }

    return prices;
  } catch {
    return [];
  }
}

function parseEffectiveDate(raw: string): string {
  // Format: "02-05-2026" (DD-MM-YYYY)
  const parts = raw.split("-");
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).toISOString();
  }
  return new Date().toISOString();
}
