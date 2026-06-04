import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { FDRateData, FDRate } from "@/lib/types";

const DATA_FILE = join(process.cwd(), "data", "fd-rates.json");
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

async function readCache(): Promise<FDRateData | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data: FDRateData = JSON.parse(raw);
    const age = Date.now() - new Date(data.lastVerified).getTime();
    if (age < CACHE_MAX_AGE) return data;
  } catch {}
  return null;
}

async function writeCache(data: FDRateData): Promise<void> {
  try {
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

// --- People's Bank: scrape /interest-rate (Table 0 = standard FD rates) ---
async function scrapePeoplesBank(): Promise<FDRate | null> {
  try {
    const res = await fetch("https://www.peoplesbank.lk/interest-rate", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // First table has: Period | At Maturity p.a. | Monthly p.a.
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return null;

    const tableText = tableMatch[1]
      .replace(/<[^>]*>/g, "|")
      .replace(/\|+/g, "|")
      .replace(/\s+/g, " ");

    // Extract "At Maturity" rates for standard tenors
    const rates: FDRate["rates"] = { "3m": null, "6m": null, "12m": null, "24m": null };

    const tenorMap: Record<string, keyof typeof rates> = {
      "03 Months": "3m",
      "3 Months": "3m",
      "06 Months": "6m",
      "6 Months": "6m",
      "12 Months": "12m",
      "24 Months": "24m",
    };

    for (const [label, key] of Object.entries(tenorMap)) {
      const pattern = new RegExp(
        label.replace(/\s+/g, "\\s*") + "\\|[\\s|]*(\\d{1,2}\\.\\d{1,2})%",
        "i"
      );
      const m = tableText.match(pattern);
      if (m) rates[key] = parseFloat(m[1]);
    }

    if (rates["3m"] || rates["12m"]) {
      return { bank: "People's Bank", shortName: "People's", rates };
    }
  } catch {}
  return null;
}

// --- Commercial Bank: scrape /rates-tariff (LKR FD rates section) ---
async function scrapeComBank(): Promise<FDRate | null> {
  try {
    const res = await fetch("https://www.combank.lk/rates-tariff", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

    // Pattern: "X Month(s) -Interest at maturity (LKR) RATE AER SENIOR"
    // We want the "at maturity" rate for each tenor
    const rates: FDRate["rates"] = { "3m": null, "6m": null, "12m": null, "24m": null };

    const patterns: [RegExp, keyof typeof rates][] = [
      [/3\s*Month\s*\(LKR\)\s*([\d.]+)/i, "3m"],
      [/6\s*Month\s*\(LKR\)\s*([\d.]+)/i, "6m"],
      [/12\s*Months?\s*-\s*Interest\s+at\s+maturity\s*\(LKR\)\s*([\d.]+)/i, "12m"],
      [/24\s*Months?\s*-\s*Interest\s+at\s+maturity\s*\(LKR\)\s*([\d.]+)/i, "24m"],
    ];

    for (const [pattern, key] of patterns) {
      const m = text.match(pattern);
      if (m) rates[key] = parseFloat(m[1]);
    }

    if (rates["3m"] || rates["12m"]) {
      return { bank: "Commercial Bank", shortName: "ComBank", rates };
    }
  } catch {}
  return null;
}

// --- BOC: scrape /rates-tariff (Rupee Deposit Rates section) ---
async function scrapeBOC(): Promise<FDRate | null> {
  try {
    const res = await fetch("https://www.boc.lk/rates-tariff", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

    // BOC format: "3 Month 6.75%" and "1 Year -Interest at maturity 7.25%"
    const rates: FDRate["rates"] = { "3m": null, "6m": null, "12m": null, "24m": null };

    const patterns: [RegExp, keyof typeof rates][] = [
      [/3\s*Month\s+([\d.]+)%/i, "3m"],
      [/6\s*Month\s+([\d.]+)%/i, "6m"],
      [/1\s*Year\s*-\s*Interest\s+at\s+maturity\s+([\d.]+)%/i, "12m"],
      [/2\s*Years?\s*-\s*Interest\s+at\s+maturity\s+([\d.]+)%/i, "24m"],
    ];

    for (const [pattern, key] of patterns) {
      const m = text.match(pattern);
      if (m) rates[key] = parseFloat(m[1]);
    }

    if (rates["3m"] || rates["12m"]) {
      return { bank: "Bank of Ceylon", shortName: "BOC", rates };
    }
  } catch {}
  return null;
}

// --- Nations Trust Bank: scrape /deposit-interest-rates ---
async function scrapeNTB(): Promise<FDRate | null> {
  try {
    const res = await fetch("https://www.nationstrust.com/deposit-interest-rates", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");

    // Format: "LKR Fixed Deposit – Maturity (Rate per annum) 6.50% ... 7.50% ... 7.75% ... 8.00% ... 9.00%"
    // Order: 1M, 3M, 6M, 12M, 24M, 36M, 48M, 60M
    const match = text.match(
      /LKR\s+Fixed\s+Deposit\s+.{0,5}\s*Maturity\s*\(Rate\s+per\s+annum\)\s*([\d.]+)%[^%]*?([\d.]+)%[^%]*?([\d.]+)%[^%]*?([\d.]+)%[^%]*?([\d.]+)%/i
    );

    if (match) {
      const rates: FDRate["rates"] = {
        "3m": parseFloat(match[2]),
        "6m": parseFloat(match[3]),
        "12m": parseFloat(match[4]),
        "24m": parseFloat(match[5]),
      };
      return { bank: "Nations Trust Bank", shortName: "NTB", rates };
    }
  } catch {}
  return null;
}

// --- Fallback banks from cached JSON ---
async function getFallbackBanks(): Promise<FDRate[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data: FDRateData = JSON.parse(raw);
    return data.banks;
  } catch {
    return [];
  }
}

export async function getFDRates(): Promise<FDRateData> {
  // Return cache if fresh
  const cached = await readCache();
  if (cached) return cached;

  // Scrape live sources in parallel
  const [boc, peoples, combank, ntb] = await Promise.all([
    scrapeBOC(),
    scrapePeoplesBank(),
    scrapeComBank(),
    scrapeNTB(),
  ]);

  const fallback = await getFallbackBanks();
  const banks: FDRate[] = [];

  // BOC: live or fallback
  if (boc) {
    banks.push(boc);
  } else {
    const fb = fallback.find((b) => b.shortName === "BOC");
    if (fb) banks.push(fb);
  }

  // People's Bank: live or fallback
  if (peoples) {
    banks.push(peoples);
  } else {
    const fb = fallback.find((b) => b.shortName === "People's");
    if (fb) banks.push(fb);
  }

  // ComBank: live or fallback
  if (combank) {
    banks.push(combank);
  } else {
    const fb = fallback.find((b) => b.shortName === "ComBank");
    if (fb) banks.push(fb);
  }

  // NTB: live or fallback
  if (ntb) {
    banks.push(ntb);
  } else {
    const fb = fallback.find((b) => b.shortName === "NTB");
    if (fb) banks.push(fb);
  }

  const result: FDRateData = {
    banks,
    lastVerified: new Date().toISOString().split("T")[0],
    source: "Live rates from bank websites",
  };

  await writeCache(result);
  return result;
}
