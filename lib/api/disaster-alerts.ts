import type { DisasterAlert } from "@/lib/types";

const CONTENT_JSON_URL = "https://www.meteo.gov.lk/content.json";

interface MeteoAdvisory {
  tsunami_pdf?: string;
  land_pdf?: string;
  lighting_pdf?: string;
  sea_pdf?: string;
  heat_pdf?: string;
}

/**
 * Fetch active disaster/weather alerts from the Department of Meteorology.
 * Uses the official content.json endpoint from meteo.gov.lk.
 * Falls back to empty array on failure.
 */
export async function getDisasterAlerts(): Promise<DisasterAlert[]> {
  try {
    const res = await fetch(CONTENT_JSON_URL, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const json = await res.json();
    const alerts: DisasterAlert[] = [];
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 1. Check active advisories from severe_weather_advisory
    const advisory: MeteoAdvisory | undefined = json.severe_weather_advisory;
    if (advisory) {
      const advisoryTypes = [
        { key: "tsunami_pdf", label: "Tsunami Warning", type: "tsunami" as const, severity: "critical" as const },
        { key: "land_pdf", label: "Land Area Advisory", type: "landslide" as const, severity: "high" as const },
        { key: "lighting_pdf", label: "Lightning Advisory", type: "heavy-rain" as const, severity: "high" as const },
        { key: "sea_pdf", label: "Sea Area Advisory", type: "cyclone" as const, severity: "medium" as const },
        { key: "heat_pdf", label: "Heat Advisory", type: "drought" as const, severity: "high" as const },
      ] as const;

      for (const adv of advisoryTypes) {
        const pdfUrl = advisory[adv.key as keyof MeteoAdvisory];
        if (pdfUrl && pdfUrl.trim() !== "") {
          alerts.push({
            id: `meteo-${adv.key}`,
            type: adv.type,
            severity: adv.severity,
            title: `${adv.label} — Active`,
            description: `The Department of Meteorology has issued an active ${adv.label.toLowerCase()}. View the official bulletin for details.`,
            affectedAreas: ["Sri Lanka"],
            issuedAt: now,
            expiresAt: expires,
            source: "Department of Meteorology",
          });
        }
      }
    }

    // 2. Parse weather forecast for heavy rainfall warnings
    const forecast: string | undefined = json.public_weather_forecast;
    if (forecast) {
      const enMatch = forecast.match(/WEATHER FORECAST[\s\S]*$/i);
      if (enMatch) {
        const enForecast = enMatch[0];
        const hasHeavyRain = /(?:fairly heavy|heavy)\s+(?:rain|falls|showers)/i.test(enForecast);

        if (hasHeavyRain) {
          // Extract affected areas
          const areaPattern =
            /(?:in|over)\s+((?:Western|Eastern|Southern|Northern|North-western|North-central|Sabaragamuwa|Central|Uva)\s*(?:(?:,\s*|\s+and\s+)(?:Western|Eastern|Southern|Northern|North-western|North-central|Sabaragamuwa|Central|Uva))*)\s*provinces?/gi;
          const districtPattern =
            /(?:in\s+)?((?:Colombo|Gampaha|Kalutara|Kandy|Matale|Nuwara-Eliya|Galle|Matara|Hambantota|Ratnapura|Kegalle|Jaffna|Kilinochchi|Mannar|Vavuniya|Mullaitivu|Batticaloa|Ampara|Trincomalee|Kurunegala|Puttalam|Anuradhapura|Polonnaruwa|Badulla|Monaragala)\s*(?:(?:,\s*|\s+and\s+)(?:Colombo|Gampaha|Kalutara|Kandy|Matale|Nuwara-Eliya|Galle|Matara|Hambantota|Ratnapura|Kegalle|Jaffna|Kilinochchi|Mannar|Vavuniya|Mullaitivu|Batticaloa|Ampara|Trincomalee|Kurunegala|Puttalam|Anuradhapura|Polonnaruwa|Badulla|Monaragala))*)\s*districts?/gi;

          const areas: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = areaPattern.exec(enForecast)) !== null) {
            areas.push(...m[1].split(/\s*(?:,|\s+and\s+)\s*/).map((s) => s.trim()));
          }
          while ((m = districtPattern.exec(enForecast)) !== null) {
            areas.push(...m[1].split(/\s*(?:,|\s+and\s+)\s*/).map((s) => s.trim()));
          }
          const uniqueAreas = [...new Set(areas.filter(Boolean))];

          const dateMatch = enForecast.match(/Issued at .+? on (.+?)[\.\n]/i);
          const issuedDate = dateMatch
            ? new Date(dateMatch[1].trim()).toISOString()
            : now;

          alerts.push({
            id: "meteo-heavy-rain",
            type: "heavy-rain",
            severity: "high",
            title: "Heavy Rainfall Warning — " + (uniqueAreas.slice(0, 3).join(", ") || "Multiple Areas"),
            description: enForecast
              .replace(/WEATHER FORECAST FOR .+/i, "")
              .replace(/Issued at .+?\./i, "")
              .trim()
              .slice(0, 300),
            affectedAreas: uniqueAreas.length > 0 ? uniqueAreas : ["Multiple areas"],
            issuedAt: issuedDate,
            expiresAt: expires,
            source: "Department of Meteorology",
          });
        }
      }
    }

    return alerts;
  } catch {
    return [];
  }
}
