import type { LoadSheddingStatus } from "@/lib/types";

const CEB_NEWS_URL = "https://ceb.lk/news/en";

const LOAD_SHEDDING_KEYWORDS = [
  "load shedding",
  "power cut",
  "load-shedding",
  "scheduled interruption",
  "rolling blackout",
  "power outage schedule",
];

/**
 * Check CEB news for any recent load shedding announcements.
 * CEB doesn't have a public API, so we scan their news page for keywords.
 */
export async function getLoadSheddingStatus(): Promise<LoadSheddingStatus> {
  try {
    const res = await fetch(CEB_NEWS_URL, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "IslandWatch/1.0 (dashboard; contact@example.com)" },
    });
    if (!res.ok) return inactive();

    const html = await res.text();

    // Extract news item titles and links from the page
    // CEB news items typically follow: <a href="/news_detail/NNN/en">Title</a>
    const linkPattern = /<a\s+href="(\/news_detail\/[^"]+)"[^>]*>\s*([^<]{10,200})\s*<\/a>/gi;
    let m: RegExpExecArray | null;

    while ((m = linkPattern.exec(html)) !== null) {
      const href = m[1];
      const title = m[2].trim().replace(/\s+/g, " ");
      const lower = title.toLowerCase();

      if (LOAD_SHEDDING_KEYWORDS.some((kw) => lower.includes(kw))) {
        return {
          isActive: true,
          announcementTitle: title,
          announcementUrl: `https://ceb.lk${href}`,
          detectedAt: new Date().toISOString(),
          source: "CEB",
        };
      }
    }

    return inactive();
  } catch {
    return inactive();
  }
}

function inactive(): LoadSheddingStatus {
  return {
    isActive: false,
    announcementTitle: null,
    announcementUrl: null,
    detectedAt: null,
    source: "CEB",
  };
}
