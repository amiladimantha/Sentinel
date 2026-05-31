import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { LPGPrice } from "@/lib/types";

const LAUGFS_URL = "https://www.laugfsgas.lk/";
const DATA_FILE = join(process.cwd(), "data", "lpg-prices.json");

interface StoredLPGData {
  prices: Record<string, number>;
  history: Record<string, { date: string; price: number }[]>;
  lastUpdated: string;
}

function readStoredData(): StoredLPGData {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      prices: parsed.prices ?? {},
      history: parsed.history ?? {},
      lastUpdated: parsed.lastUpdated ?? "",
    };
  } catch {
    return { prices: {}, history: {}, lastUpdated: "" };
  }
}

function writeStoredData(data: StoredLPGData): void {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // non-critical
  }
}

const DISPLAY_NAMES: Record<string, string> = {
  "12.5kg": "12.5 kg",
  "5kg": "5 kg",
};

const SIZE_ORDER = ["12.5kg", "5kg"];

/**
 * Fetch LPG cylinder prices by scraping laugfsgas.lk.
 * LPG prices in Sri Lanka are government-regulated — both Litro Gas and Laugfs
 * sell at the same price, so scraping Laugfs gives the regulated price for all.
 */
export async function getLPGPrices(): Promise<LPGPrice[]> {
  try {
    const res = await fetch(LAUGFS_URL, { next: { revalidate: 900 } });
    if (!res.ok) return getFallbackPrices();

    const html = await res.text();
    const stored = readStoredData();
    const today = new Date().toISOString().slice(0, 10);

    // The site renders a table with labels in one row and prices in the next:
    //   <td>12.5kg cylinder refill</td><td>5kg cylinder refill</td>
    //   <td>Rs 6,245/-</td><td>Rs 2,500/-</td>
    // Match each size+price pair across the HTML (lazy [\s\S]*? crosses row boundaries)
    const pricePattern = /(\d+(?:\.\d+)?kg)\s*cylinder\s*refill[\s\S]*?Rs\s*([\d,]+)\/-/gi;

    const found = new Map<string, number>();
    let m: RegExpExecArray | null;
    while ((m = pricePattern.exec(html)) !== null) {
      const size = m[1]; // "12.5kg" or "5kg"
      const price = parseFloat(m[2].replace(/,/g, ""));
      if (!isNaN(price) && size in DISPLAY_NAMES) {
        found.set(size, price);
      }
    }

    if (found.size === 0) return getFallbackPrices();

    const newPrices = { ...stored.prices };
    const newHistory: Record<string, { date: string; price: number }[]> = { ...stored.history };
    let hasChanged = false;

    for (const [size, price] of found) {
      const prev = stored.prices[size] ?? price;
      if (price !== prev) hasChanged = true;
      newPrices[size] = price;

      const hist = [...(newHistory[size] ?? [])];
      const lastEntry = hist[hist.length - 1];
      if (!lastEntry || lastEntry.date !== today) {
        hist.push({ date: today, price });
      } else {
        lastEntry.price = price;
      }
      newHistory[size] = hist.slice(-30);
    }

    if (hasChanged || !stored.lastUpdated) {
      writeStoredData({ prices: newPrices, history: newHistory, lastUpdated: today });
    }

    return buildPriceList(newPrices, stored.prices, newHistory, today);
  } catch {
    return getFallbackPrices();
  }
}

function getFallbackPrices(): LPGPrice[] {
  const stored = readStoredData();
  if (!Object.keys(stored.prices).length) return [];
  return buildPriceList(stored.prices, stored.prices, stored.history, stored.lastUpdated);
}

function buildPriceList(
  prices: Record<string, number>,
  prevPrices: Record<string, number>,
  history: Record<string, { date: string; price: number }[]>,
  lastUpdated: string
): LPGPrice[] {
  return Object.entries(prices)
    .filter(([k]) => k in DISPLAY_NAMES)
    .sort(([a], [b]) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
    .map(([size, price]) => ({
      size: size as LPGPrice["size"],
      displayName: DISPLAY_NAMES[size],
      price,
      previousPrice: prevPrices[size] ?? price,
      unit: "LKR/cylinder" as const,
      lastUpdated,
      history: history[size] ?? [],
    }));
}
