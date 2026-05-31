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

    // Extract accordion heading items — each has title= attribute and data-id
    const headingRe =
      /<div[^>]*class="[^"]*accordion-heading[^"]*"[^>]*>[\s\S]*?<a[^>]+title="([^"]+)"[^>]+data-id="([^"]+)"/g;
    const notices: TrafficNotice[] = [];
    let m: RegExpExecArray | null;

    while ((m = headingRe.exec(html)) !== null) {
      const raw = m[1].trim();
      // Decode HTML entities
      const title = raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      const id = m[2].trim();

      if (!title || title.length < 4) continue;
      notices.push({
        id: `rda-${id}`,
        title,
        url: RDA_URL + `#${id}`,
        source: "RDA",
      });
    }

    return notices.slice(0, 5);
  } catch {
    return [];
  }
}
