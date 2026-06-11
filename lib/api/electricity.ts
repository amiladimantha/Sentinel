import { dedupeInFlight } from "@/lib/api/dedupe";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/api/runtime-json";
import type { ElectricityTariff, ElectricityHikeHistory } from "@/lib/types";

const DATA_FILE = "electricity-rates.json";

interface TariffBlock {
  units: string;
  rate: number;
  fixedCharge: number;
}

interface TariffScheme {
  label: string;
  maxUnits: number | null;
  blocks: TariffBlock[];
}

interface StoredElectricityData {
  schemes: Record<"low" | "mid" | "high", TariffScheme>;
  effectiveDate: string;
  source: string;
  hikeHistory: ElectricityHikeHistory[];
  lastUpdated: string;
}

async function readStoredData(): Promise<StoredElectricityData | null> {
  return readRuntimeJson<StoredElectricityData>(DATA_FILE);
}

async function writeStoredData(data: StoredElectricityData): Promise<void> {
  try {
    await writeRuntimeJson(DATA_FILE, data);
  } catch {
    // non-critical, ignore write errors
  }
}

/**
 * Scrapes GlobalPetrolPrices for average household electricity price (LKR/kWh).
 * Used only for seeding hike history chart.
 */
async function fetchAverageElectricityPrice(): Promise<{
  household: number;
  business: number | null;
  date: string;
} | null> {
  const url = "https://www.globalpetrolprices.com/Sri-Lanka/electricity_prices/";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;

  const html = await res.text();

  const householdMatch = html.match(
    /(?:residential|household)[^<]{0,200}?(\d+\.\d+)\s*per\s*kWh/i
  ) ?? html.match(/LKR\s*(\d+\.\d+)\s*per\s*kWh/i);

  const businessMatch = html.match(
    /(?:business)[^<]{0,200}?LKR\s*(\d+\.\d+)\s*(?:kWh|per)/i
  );

  const dateMatch = html.match(
    /(?:collected|updated)\s+in\s+([\w]+\s+\d{4})/i
  );

  const household = householdMatch ? parseFloat(householdMatch[1]) : null;
  const business = businessMatch ? parseFloat(businessMatch[1]) : null;

  if (!household) return null;

  return {
    household,
    business: business ?? null,
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0],
  };
}

/**
 * Fetches and parses the PUCSL calculator JS to extract the current approved
 * domestic tariff. The JS file at pucsl.gov.lk/calculator/js/calculator.js
 * contains all rates and fixed charges in plain JavaScript arithmetic.
 */
async function fetchPUCSLTariffData(): Promise<{
  schemes: StoredElectricityData["schemes"];
  effectiveDate: string;
  source: string;
} | null> {
  const [jsRes, htmlRes] = await Promise.allSettled([
    fetch("https://www.pucsl.gov.lk/calculator/js/calculator.js", {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    }),
    fetch("https://www.pucsl.gov.lk/calculator/", {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    }),
  ]);

  if (jsRes.status !== "fulfilled" || !jsRes.value.ok) return null;
  const js = await jsRes.value.text();

  // Extract effective date from the HTML subtitle
  let effectiveDate = new Date().toISOString().split("T")[0];
  if (htmlRes.status === "fulfilled" && htmlRes.value.ok) {
    const html = await htmlRes.value.text();
    const m = html.match(/Effective from (\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (m) {
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[m[2].toLowerCase().slice(0, 3)];
      if (month) effectiveDate = `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
    }
  }

  // Parse rates from arithmetic patterns.
  // Anchor to "energyCharge +=" to avoid matching inside template literal strings
  // (e.g. "(b1 * 5).toFixed(2)") which would give duplicate values.
  const b1 = [...js.matchAll(/energyCharge\s*\+=\s*b1\s*\*\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const b2 = [...js.matchAll(/energyCharge\s*\+=\s*b2\s*\*\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const b3m = js.match(/energyCharge\s*\+=\s*b3\s*\*\s*([\d.]+)/);
  const b4m = js.match(/energyCharge\s*\+=\s*b4\s*\*\s*([\d.]+)/);
  const ft = js.match(/energyCharge\s*\+=\s*firstTier\s*\*\s*([\d.]+)/);
  const st = js.match(/energyCharge\s*\+=\s*secondTier\s*\*\s*([\d.]+)/);

  // Low scheme fixed charges via ternary: "units <= block30 ? 80 : 210"
  const ternary = js.match(/\?\s*(\d+)\s*:\s*(\d+)/);

  // Mid and high scheme fixed charges via assignments.
  // The JS initialises `let fixedCharge = 0;` so we filter out 0.
  const fixedAssigns = [...js.matchAll(/fixedCharge\s*=\s*([\d.]+)/g)]
    .map((m) => parseFloat(m[1]))
    .filter((v) => v > 0); // skip the initial "= 0"

  // Validate we have all needed values
  if (
    b1.length < 2 || b2.length < 2 ||
    !b3m || !b4m || !ft || !st || !ternary ||
    fixedAssigns.length < 4
  ) {
    return null;
  }

  return {
    schemes: {
      low: {
        label: "≤60 kWh/month",
        maxUnits: 60,
        blocks: [
          { units: "0-30 kWh", rate: b1[0], fixedCharge: parseInt(ternary[1]) },
          { units: "31-60 kWh", rate: b2[0], fixedCharge: parseInt(ternary[2]) },
        ],
      },
      mid: {
        label: "61–180 kWh/month",
        maxUnits: 180,
        blocks: [
          { units: "0-60 kWh", rate: b1[1], fixedCharge: 0 },
          { units: "61-90 kWh", rate: b2[1], fixedCharge: fixedAssigns[0] },
          { units: "91-120 kWh", rate: parseFloat(b3m[1]), fixedCharge: fixedAssigns[1] },
          { units: "121-180 kWh", rate: parseFloat(b4m[1]), fixedCharge: fixedAssigns[2] },
        ],
      },
      high: {
        label: ">180 kWh/month",
        maxUnits: null,
        blocks: [
          { units: "0-180 kWh", rate: parseFloat(ft[1]), fixedCharge: 0 },
          { units: "181+ kWh", rate: parseFloat(st[1]), fixedCharge: fixedAssigns[3] },
        ],
      },
    },
    effectiveDate,
    source: "PUCSL Calculator (pucsl.gov.lk/calculator)",
  };
}

function buildTariffList(
  schemes: StoredElectricityData["schemes"],
  effectiveDate: string,
): ElectricityTariff[] {
  const tariffs: ElectricityTariff[] = [];
  for (const [schemeKey, scheme] of Object.entries(schemes) as [
    "low" | "mid" | "high",
    TariffScheme,
  ][]) {
    for (const block of scheme.blocks) {
      tariffs.push({
        category: `Domestic (${block.units})`,
        units: block.units,
        rate: block.rate,
        previousRate: block.rate,
        effectiveDate,
        fixedCharge: block.fixedCharge,
        scheme: schemeKey,
      });
    }
  }
  return tariffs;
}

/**
 * Returns all tariff blocks from all three consumption schemes.
 * Attempts to fetch live data from the PUCSL calculator JS (daily cache).
 * Falls back to the last successfully stored data in electricity-rates.json.
 */
export function getElectricityTariffs(): Promise<ElectricityTariff[]> {
  return dedupeInFlight("electricity-tariffs", getElectricityTariffsFresh);
}

async function getElectricityTariffsFresh(): Promise<ElectricityTariff[]> {
  const stored = await readStoredData();

  try {
    const live = await fetchPUCSLTariffData();
    if (live) {
      const liveJson = JSON.stringify(live.schemes);
      const storedJson = stored ? JSON.stringify(stored.schemes) : "";

      if (liveJson !== storedJson || live.effectiveDate !== stored?.effectiveDate) {
        await writeStoredData({
          schemes: live.schemes,
          effectiveDate: live.effectiveDate,
          source: live.source,
          hikeHistory: stored?.hikeHistory ?? [],
          lastUpdated: new Date().toISOString(),
        });
      }

      return buildTariffList(live.schemes, live.effectiveDate);
    }
  } catch {
    // fall through to stored data
  }

  if (stored) {
    return buildTariffList(stored.schemes, stored.effectiveDate);
  }

  return [];
}

export function getElectricityHikeHistory(): Promise<
  ElectricityHikeHistory[]
> {
  return dedupeInFlight("electricity-hike-history", getElectricityHikeHistoryFresh);
}

async function getElectricityHikeHistoryFresh(): Promise<
  ElectricityHikeHistory[]
> {
  const stored = await readStoredData();
  if (stored && stored.hikeHistory.length >= 2) {
    return stored.hikeHistory;
  }

  // If no stored history, try to seed from GlobalPetrolPrices average
  try {
    const priceData = await fetchAverageElectricityPrice();
    if (priceData) {
      const avg = priceData.household;
      const month =
        priceData.date.replace(/\b(\w{3})\w*\s+(\d{2})\d{2}/, "$1 $2") ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });

      const history: ElectricityHikeHistory[] = [{ month, rate: avg }];

      if (stored) {
        await writeStoredData({
          ...stored,
          hikeHistory: history,
          lastUpdated: new Date().toISOString(),
        });
      }

      return history;
    }
  } catch {
    // fall through
  }
  return [];
}


