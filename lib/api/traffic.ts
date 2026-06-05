import type { TrafficNotice } from "@/lib/types";

const RDA_URL =
  "https://rda.gov.lk/index.php?option=com_content&view=article&id=38&Itemid=132&lang=en";

export async function getTrafficNotices(): Promise<TrafficNotice[]> {
  try {
    const res = await fetch(RDA_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extract accordion panels — heading + inner body pairs
    const panelRe =
      /<div[^>]*class="[^"]*accordion-heading[^"]*"[^>]*>[\s\S]*?<a[^>]+title="([^"]+)"[^>]+data-id="([^"]+)"[\s\S]*?<div[^>]*class="[^"]*accordion-inner[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*accordion-heading|$)/g;
    const notices: TrafficNotice[] = [];
    let m: RegExpExecArray | null;

    while ((m = panelRe.exec(html)) !== null) {
      const raw = m[1].trim();
      // Decode HTML entities
      const title = raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      const id = m[2].trim();
      const body = m[3] || "";

      if (!title || title.length < 4) continue;

      // Extract date from PDF filename (e.g. 2026_05_13_...pdf)
      let publishedAt: string | undefined;
      const dateMatch = body.match(/(\d{4})[_\-](\d{2})[_\-](\d{2})/);  
      if (dateMatch) {
        const [, y, mo, d] = dateMatch;
        const parsed = new Date(`${y}-${mo}-${d}`);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString();
        }
      }

      notices.push({
        id: `rda-${id}`,
        title,
        url: RDA_URL + `#${id}`,
        source: "RDA",
        publishedAt,
      });
    }

    return notices.slice(0, 5);
  } catch {
    return [];
  }
}
