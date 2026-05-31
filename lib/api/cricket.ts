import type { CricketMatch } from "@/lib/types";

const CRICINFO_LIVE_RSS = "https://static.cricinfo.com/rss/livescores.xml";

export async function getSriLankaCricket(): Promise<CricketMatch[]> {
  try {
    const res = await fetch(CRICINFO_LIVE_RSS, {
      next: { revalidate: 120 }, // refresh every 2 minutes
      headers: { "User-Agent": "IslandWatch/1.0 (dashboard; contact@example.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
    const matches: CricketMatch[] = [];
    let m: RegExpExecArray | null;

    while ((m = itemPattern.exec(xml)) !== null) {
      const block = m[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");

      if (!title) continue;

      // Filter for matches involving Sri Lanka
      const isSL =
        /sri\s*lanka/i.test(title) ||
        /\bSL\b/.test(title) ||
        /\bLKA\b/.test(title);

      if (isSL) {
        matches.push({
          title: decodeEntities(title),
          url: link || "https://www.espncricinfo.com",
          isLive: true, // if it's in the live feed, it's live
        });
      }
    }

    return matches;
  } catch {
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i")
  );
  return m ? m[1].trim() : "";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}
