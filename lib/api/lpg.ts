import { dedupeInFlight } from "@/lib/api/dedupe";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/api/runtime-json";
import type { LPGPrice } from "@/lib/types";

const LAUGFS_PRICE_LIST_URL = "https://www.laugfsgas.lk/pricelist.php";
const LAUGFS_URL = "https://www.laugfsgas.lk/";
const DATA_FILE = "lpg-prices.json";

interface StoredLPGData {
  prices: Record<string, number>;
  history: Record<string, { date: string; price: number }[]>;
  lastUpdated: string;
}

async function readStoredData(): Promise<StoredLPGData> {
  const parsed = await readRuntimeJson<Partial<StoredLPGData>>(DATA_FILE);
  if (!parsed) {
    return { prices: {}, history: {}, lastUpdated: "" };
  }

  return {
    prices: parsed.prices ?? {},
    history: parsed.history ?? {},
    lastUpdated: parsed.lastUpdated ?? "",
  };
}

async function writeStoredData(data: StoredLPGData): Promise<void> {
  try {
    await writeRuntimeJson(DATA_FILE, data);
  } catch {
    // non-critical
  }
}

const DISPLAY_NAMES: Record<string, string> = {
  "12.5kg": "12.5 kg",
  "5kg": "5 kg",
};

const SIZE_ORDER = ["12.5kg", "5kg"];
const PRIMARY_DISTRICT = "kalutara";
const SECONDARY_DISTRICT = "colombo";

/**
 * Fetch LPG cylinder prices by scraping laugfsgas.lk.
 * LPG prices in Sri Lanka are government-regulated — both Litro Gas and Laugfs
 * sell at the same price, so scraping Laugfs gives the regulated price for all.
 */
export function getLPGPrices(): Promise<LPGPrice[]> {
  return dedupeInFlight("lpg-prices", getLPGPricesFresh);
}

async function getLPGPricesFresh(): Promise<LPGPrice[]> {
  try {
    const primaryFound = await getDistrictWisePrices();
    if (primaryFound) {
      return persistAndBuildPrices(primaryFound);
    }

    const fallbackFound = await getHomepagePrices();
    if (fallbackFound) {
      return persistAndBuildPrices(fallbackFound);
    }

    return getFallbackPrices();
  } catch {
    return getFallbackPrices();
  }
}

async function getDistrictWisePrices(): Promise<Map<string, number> | null> {
  const res = await fetch(LAUGFS_PRICE_LIST_URL, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;

  const html = await res.text();

  // Rows look like:
  // <td>Colombo</td><td>6245.00</td><td>2500.00</td><td>1000.00</td><td>20550.00</td>
  const rowPattern =
    /<tr[^>]*>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>\s*<td[^>]*>\s*([\d,.]+)\s*<\/td>\s*<td[^>]*>\s*([\d,.]+)\s*<\/td>[\s\S]*?<\/tr>/gi;

  let firstRow: Map<string, number> | null = null;
  let secondaryRow: Map<string, number> | null = null;
  let m: RegExpExecArray | null;

  while ((m = rowPattern.exec(html)) !== null) {
    const district = m[1].trim().toLowerCase();
    const price12 = parseFloat(m[2].replace(/,/g, ""));
    const price5 = parseFloat(m[3].replace(/,/g, ""));

    if (isNaN(price12) || isNaN(price5)) continue;

    const prices = new Map<string, number>([
      ["12.5kg", price12],
      ["5kg", price5],
    ]);

    if (!firstRow) firstRow = prices;
    if (district.includes(PRIMARY_DISTRICT)) return prices;
    if (!secondaryRow && district.includes(SECONDARY_DISTRICT)) {
      secondaryRow = prices;
    }
  }

  // If Kalutara row is unavailable, fall back to Colombo, then first parsed row.
  return secondaryRow ?? firstRow;
}

async function getHomepagePrices(): Promise<Map<string, number> | null> {
  const res = await fetch(LAUGFS_URL, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;

  const html = await res.text();

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

  return found.size ? found : null;
}

async function persistAndBuildPrices(found: Map<string, number>): Promise<LPGPrice[]> {
  const stored = await readStoredData();
  const today = new Date().toISOString().slice(0, 10);

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
    await writeStoredData({ prices: newPrices, history: newHistory, lastUpdated: today });
  }

  return buildPriceList(newPrices, stored.prices, newHistory, today);
}

async function getFallbackPrices(): Promise<LPGPrice[]> {
  const stored = await readStoredData();
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
