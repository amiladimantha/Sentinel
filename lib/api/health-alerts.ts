import type { HealthAlert } from "@/lib/types";

const EPID_NEWS_URL = "https://www.epid.gov.lk/news/news";
const MAX_HEALTH_HTML_LENGTH = 250_000;

// Known EPID nav / static page slugs to exclude from news results
const NAV_SLUGS = new Set([
  "vision-and-mission", "organization-structure", "history", "key-achievements",
  "milestones", "careers-at-epid", "news", "immunization-programme-implementation",
  "vpd", "special-vaccination-campaigns", "circulars-letters", "reporting-forms",
  "web-resources", "surveillance-methods", "list-of-notifiable-diseases",
  "vaccine-preventable-diseases", "weekly-epidemiological-report",
  "quarterly-epidemiological-bulletin", "investigation-forms",
  "disease-surveillance-during-disaster", "fact-sheets", "web-resources-2",
  "high-endemic-diseases-outbreaks", "local", "international",
  "web-based-opportunities", "publications", "circulars-circular-letters",
  "policy-strategic-plans", "review-reporting-surveillance-forms",
  "data-request-form", "video-gallery", "image-gallery", "home", "search",
]);

export async function getHealthAlerts(): Promise<HealthAlert[]> {
  try {
    const res = await fetch(EPID_NEWS_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
      headers: { Cookie: "locale=en" },
    });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, MAX_HEALTH_HTML_LENGTH);
    const alerts: HealthAlert[] = [];

    // Strategy 1: Parse stripped text for "YYYY-MM-DD Title" pairs that appear
    // after the navigation section (which ends with "Image Gallery")
    const stripped = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    const navEnd = stripped.lastIndexOf("Image Gallery");
    const afterNav = navEnd > 0 ? stripped.slice(navEnd) : stripped;
    const dateItemRe =
      /(\d{4}-\d{2}-\d{2})\s+([A-Z][^0-9\n]{10,150}?)(?=\d{4}-\d{2}-\d{2}|Contact details|$)/g;
    let m: RegExpExecArray | null;
    while ((m = dateItemRe.exec(afterNav)) !== null && alerts.length < 5) {
      const date = m[1];
      const title = m[2].trim().replace(/\s+/g, " ").replace(/\.$/, "");
      if (title.length < 10) continue;
      alerts.push({
        id: `epid-${date}-${alerts.length}`,
        title,
        url: EPID_NEWS_URL,
        publishedAt: new Date(date).toISOString(),
        source: "Epidemiology Unit",
      });
    }

    // Strategy 2: find article links using title= attribute, excluding known nav slugs
    if (alerts.length === 0) {
      const linkRe =
        /href="(https:\/\/www\.epid\.gov\.lk\/([a-z0-9-]+)\/([a-z0-9-]+))"[^>]*title="([^"]{10,120})"/g;
      while ((m = linkRe.exec(html)) !== null && alerts.length < 5) {
        const url = m[1];
        const slug1 = m[2];
        const slug2 = m[3];
        const title = m[4].trim();
        if (NAV_SLUGS.has(slug1) || NAV_SLUGS.has(slug2)) continue;
        if (!title || title.length < 10) continue;
        alerts.push({
          id: `epid-link-${alerts.length}`,
          title,
          url,
          publishedAt: new Date().toISOString(),
          source: "Epidemiology Unit",
        });
      }
    }

    return alerts;
  } catch {
    return [];
  }
}
