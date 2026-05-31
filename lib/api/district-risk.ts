import type { DistrictRisk } from "@/lib/types";

const CONTENT_JSON_URL = "https://www.meteo.gov.lk/content.json";

/** Province → constituent districts mapping */
const PROVINCE_DISTRICTS: Record<string, string[]> = {
  Western: ["Colombo", "Gampaha", "Kalutara"],
  Central: ["Kandy", "Matale", "NuwaraEliya"],
  Southern: ["Galle", "Matara", "Hambantota"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  Eastern: ["Batticaloa", "Ampara", "Trincomalee"],
  "North-western": ["Kurunegala", "Puttalam"],
  "North-central": ["Anuradhapura", "Polonnaruwa"],
  Uva: ["Badulla", "Moneragala"],
  Sabaragamuwa: ["Ratnapura", "Kegalle"],
};

/** Normalize district names from forecast text to match GeoJSON names */
const DISTRICT_ALIAS: Record<string, string> = {
  "Nuwara-Eliya": "NuwaraEliya",
  "Nuwara Eliya": "NuwaraEliya",
  "NuwaraEliya": "NuwaraEliya",
  Monaragala: "Moneragala",
};

/** All 25 district names as they appear in GeoJSON */
const ALL_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Moneragala", "Mullaitivu", "NuwaraEliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

type RiskLevel = "none" | "low" | "moderate" | "high" | "critical";

/**
 * Parse the English forecast from meteo.gov.lk and extract district-level
 * weather risk based on mentioned rainfall intensity and advisory status.
 */
export async function getDistrictRisks(): Promise<DistrictRisk[]> {
  try {
    const res = await fetch(CONTENT_JSON_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return getDefaultRisks();

    const json = await res.json();
    const risks = new Map<string, { level: RiskLevel; reason: string }>();

    // Initialize all districts as "none"
    for (const d of ALL_DISTRICTS) {
      risks.set(d, { level: "none", reason: "" });
    }

    // 1. Parse public weather forecast
    const forecast: string | undefined = json.public_weather_forecast;
    if (forecast) {
      const enMatch = forecast.match(/WEATHER FORECAST[\s\S]*?(?=\n\n\d{4}|$)/i);
      if (enMatch) {
        const enText = enMatch[0];
        parseForecastSentences(enText, risks);
      }
    }

    // 2. Boost risk for active advisories
    const advisory = json.severe_weather_advisory;
    if (advisory) {
      if (advisory.land_pdf) {
        // Land advisory affects hill country districts
        for (const d of ["Kandy", "NuwaraEliya", "Matale", "Badulla", "Ratnapura", "Kegalle"]) {
          elevateRisk(risks, d, "high", "Land area advisory active");
        }
      }
      if (advisory.lighting_pdf) {
        // Lightning affects widespread areas — boost any district already at risk
        for (const [d, r] of risks) {
          if (r.level !== "none") {
            elevateRisk(risks, d, "high", "Lightning advisory active");
          }
        }
      }
    }

    return ALL_DISTRICTS.map((name) => ({
      district: name,
      level: risks.get(name)!.level,
      reason: risks.get(name)!.reason,
    }));
  } catch {
    return getDefaultRisks();
  }
}

/** Parse forecast sentences to assign risk levels */
function parseForecastSentences(
  text: string,
  risks: Map<string, { level: RiskLevel; reason: string }>
) {
  // Split into sentences
  const sentences = text.split(/\.(?:\s|$)/).filter(Boolean);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Determine intensity
    let level: RiskLevel = "none";
    let reason = "";
    if (/very heavy\s+(?:rain|showers|falls)/i.test(sentence)) {
      level = "critical";
      reason = "Very heavy rainfall expected";
    } else if (/heavy\s+(?:rain|showers|falls)/i.test(sentence)) {
      level = "high";
      reason = "Heavy rainfall expected";
    } else if (/fairly heavy\s+(?:rain|showers|falls)/i.test(sentence)) {
      level = "high";
      reason = "Fairly heavy rainfall expected";
    } else if (/thundershowers?/i.test(sentence)) {
      level = "moderate";
      reason = "Thundershowers possible";
    } else if (/showers?\s+(?:will|may)\s+occur/i.test(sentence)) {
      level = "low";
      reason = "Showers expected";
    } else if (/strong winds/i.test(sentence)) {
      level = "low";
      reason = "Strong winds expected";
    }

    if (level === "none") continue;

    // Extract provinces mentioned
    const provincePattern =
      /(?:Western|Central|Southern|Northern|Eastern|North-western|North-central|Uva|Sabaragamuwa)/gi;
    const provinces = [...sentence.matchAll(provincePattern)].map((m) => m[0]);

    // Extract districts mentioned
    const districtPattern =
      /(?:Colombo|Gampaha|Kalutara|Kandy|Matale|Nuwara[- ]?Eliya|Galle|Matara|Hambantota|Ratnapura|Kegalle|Jaffna|Kilinochchi|Mannar|Vavuniya|Mullaitivu|Batticaloa|Ampara|Trincomalee|Kurunegala|Puttalam|Anuradhapura|Polonnaruwa|Badulla|Monaragala|Moneragala)/gi;
    const districts = [...sentence.matchAll(districtPattern)].map((m) => m[0]);

    // Apply to provinces
    for (const prov of provinces) {
      const normalizedProv =
        prov.charAt(0).toUpperCase() + prov.slice(1).toLowerCase();
      // Find matching province key (case-insensitive)
      const provKey = Object.keys(PROVINCE_DISTRICTS).find(
        (k) => k.toLowerCase() === normalizedProv.toLowerCase()
      );
      if (provKey) {
        for (const d of PROVINCE_DISTRICTS[provKey]) {
          elevateRisk(risks, d, level, reason);
        }
      }
    }

    // Apply to specific districts
    for (const dist of districts) {
      const normalized = DISTRICT_ALIAS[dist] ?? dist;
      const matched = ALL_DISTRICTS.find(
        (d) => d.toLowerCase() === normalized.toLowerCase()
      );
      if (matched) {
        elevateRisk(risks, matched, level, reason);
      }
    }

    // "at a few places" reduces severity by one level
    if (/at a few places/i.test(sentence)) {
      for (const dist of districts) {
        const normalized = DISTRICT_ALIAS[dist] ?? dist;
        const matched = ALL_DISTRICTS.find(
          (d) => d.toLowerCase() === normalized.toLowerCase()
        );
        if (matched) {
          const current = risks.get(matched)!;
          if (current.level === "high") {
            risks.set(matched, { level: "moderate", reason: current.reason });
          }
        }
      }
    }
  }
}

const RISK_ORDER: RiskLevel[] = ["none", "low", "moderate", "high", "critical"];

function elevateRisk(
  risks: Map<string, { level: RiskLevel; reason: string }>,
  district: string,
  newLevel: RiskLevel,
  reason: string
) {
  const current = risks.get(district);
  if (!current) return;
  if (RISK_ORDER.indexOf(newLevel) > RISK_ORDER.indexOf(current.level)) {
    risks.set(district, { level: newLevel, reason });
  }
}

function getDefaultRisks(): DistrictRisk[] {
  return ALL_DISTRICTS.map((name) => ({
    district: name,
    level: "none" as RiskLevel,
    reason: "",
  }));
}
