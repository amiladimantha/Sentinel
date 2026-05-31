import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { ExchangeRate } from "@/lib/types";

const ER_API_URL = "https://open.er-api.com/v6/latest/LKR";
const DATA_FILE = join(process.cwd(), "data", "exchange-rates.json");

const CURRENCIES: { code: ExchangeRate["code"]; name: string }[] = [
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "EUR", name: "Euro" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
];

interface StoredRateData {
  rates: Record<string, { buying: number; selling: number }>;
  history: Record<string, { date: string; buying: number; selling: number }[]>;
  lastUpdated: string;
}

function readStoredRates(): StoredRateData {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      rates: parsed.rates ?? {},
      history: parsed.history ?? {},
      lastUpdated: parsed.lastUpdated ?? "",
    };
  } catch {
    return { rates: {}, history: {}, lastUpdated: "" };
  }
}

function writeStoredRates(data: StoredRateData): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Fetch exchange rates from the free open.er-api.com service.
 * Converts from LKR-based rates to buying/selling with a ~1.5% spread.
 * Compares with stored rates to detect changes.
 */
export async function getExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const res = await fetch(ER_API_URL, { next: { revalidate: 900 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (json.result !== "success" || !json.rates) return [];

    const lastUpdated = json.time_last_update_utc
      ? new Date(json.time_last_update_utc).toISOString()
      : new Date().toISOString();

    const stored = readStoredRates();
    const newStored: StoredRateData = { rates: {}, history: { ...stored.history }, lastUpdated };
    const today = new Date().toISOString().slice(0, 10);

    const results = CURRENCIES.map(({ code, name }) => {
      const lkrRate = json.rates[code];
      if (!lkrRate) return null!;

      // 1 foreign currency = X LKR
      const midRate = 1 / lkrRate;
      const spread = midRate * 0.015; // ~1.5% buy/sell spread

      const buyingRate = parseFloat((midRate - spread).toFixed(2));
      const sellingRate = parseFloat((midRate + spread).toFixed(2));

      // Get previous rates from stored data
      const prev = stored.rates[code];
      const previousBuyingRate = prev ? prev.buying : buyingRate;
      const previousSellingRate = prev ? prev.selling : sellingRate;

      newStored.rates[code] = { buying: buyingRate, selling: sellingRate };

      // Append daily history (one entry per day, capped at 7)
      const hist = newStored.history[code] ?? [];
      const lastEntry = hist[hist.length - 1];
      if (!lastEntry || lastEntry.date !== today) {
        hist.push({ date: today, buying: buyingRate, selling: sellingRate });
      } else {
        lastEntry.buying = buyingRate;
        lastEntry.selling = sellingRate;
      }
      newStored.history[code] = hist.slice(-7);

      return {
        currency: name,
        code,
        buyingRate,
        sellingRate,
        previousBuyingRate,
        previousSellingRate,
        lastUpdated,
        history: newStored.history[code],
      };
    });

    // Write updated rates
    writeStoredRates(newStored);

    return results;
  } catch {
    return [];
  }
}
