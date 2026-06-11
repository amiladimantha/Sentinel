import type { NewsItem } from "@/lib/types";

const RSS_FEEDS = [
  { url: "https://bizenglish.adaderana.lk/feed/", source: "Ada Derana Biz" },
  { url: "https://economynext.com/feed/", source: "EconomyNext" },
];

/**
 * Fetch latest news from multiple Sri Lankan RSS feeds.
 * Parses XML manually (no external deps).
 * Falls back to empty array on failure.
 */
export async function getNewsItems(
  category?: "accidents" | "finance" | "general"
): Promise<NewsItem[]> {
  try {
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const res = await fetch(feed.url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseFeed(xml, feed.source);
      })
    );

    const items: NewsItem[] = [];
    let id = 1;
    for (const result of feedResults) {
      if (result.status === "fulfilled") {
        for (const item of result.value) {
          items.push({ ...item, id: String(id++) });
        }
      }
    }

    // Sort by date descending and limit
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const limited = items.slice(0, 15);

    if (category) {
      return limited.filter((item) => item.category === category);
    }
    return limited;
  } catch {
    return [];
  }
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null && items.length < 10) {
    const block = match[1];

    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const descRaw = extractTag(block, "description");

    // Skip section-header items (e.g. "Local", "World", "Sports")
    if (!title || /^(local|world|sports|business|entertainment|politics|finance)\s*(news)?$/i.test(title.trim())) continue;

    // Extract image URL from description — discard if no actual filename (broken base URL)
    const imgMatch = descRaw
      ? descRaw.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
      : null;
    const rawImgUrl = imgMatch ? imgMatch[1] : null;
    const imageUrl = rawImgUrl && /\.\w{2,5}(\?|$)/.test(rawImgUrl) ? rawImgUrl : null;

    // Strip HTML from description
    const summary = descRaw
      ? descRaw.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/\s*MORE\.\.\s*$/i, "").trim()
      : "";

    // Skip items whose stripped description is just a category label (e.g. "LOCAL", "WORLD")
    if (/^[A-Z]{3,12}$/.test(summary)) continue;

    // Categorise based on keywords
    const cat = categorise(title + " " + summary);

    items.push({
      id: "0",
      title,
      summary: summary || title,
      imageUrl,
      category: cat,
      source,
      url: link || "#",
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

const FINANCE_PATTERNS = [
  /\b(?:rupee|dollar|euro|sterling|forex)\b/,
  /us\$|usd\b|\$\s*\d/,
  /\b(?:million|billion)\s+(?:dollar|grant|loan|aid|fund|rupee)/,
  /\b(?:grant|aid\s+package|financial\s+aid|foreign\s+aid)\b/,
  /\b(?:stock\s+(?:market|exchange)|colombo\s+stock|cse\b|share\s+price)\b/,
  /\b(?:inflation|deflation|gdp|imf|world\s+bank|central\s+bank)\b/,
  /\b(?:interest\s+rate|exchange\s+rate|lending\s+rate|bank\s+rate)\b/,
  /\b(?:budget|fiscal|monetary|treasury|bond|tariff|customs\s+duty)\b/,
  /\b(?:export|import|trade\s+(?:deficit|surplus|balance))\b/,
  /\b(?:economic|economy|investment|finance\s+minister|finance\s+ministry)\b/,
  /\b(?:loan|debt|credit\s+rating|foreign\s+(?:exchange|reserves?|debt))\b/,
  /\b(?:revenue|tax(?:ation)?|vat\b|customs|excise)\b/,
];

const ACCIDENT_PATTERNS = [
  /\baccident\b/,
  /\b(?:crash(?:es|ed)?|collision|collide[sd]?)\b/,
  /\b(?:injur(?:ed|ies|y)|hospitaliz(?:ed|ation))\b/,
  /\b(?:died|death\s+toll|death\s+of|killed\s+in|found\s+dead|dead\s+bod(?:y|ies))\b/,
  /\b(?:caught\s+fire|house\s+fire|building\s+(?:fire|blaze)|factory\s+fire|fire\s+(?:destroyed|killed|breaks?\s+out|breaks?\s+in|accident|truck|engine)|blaze\s+(?:at|in|kills?)|arson)\b/,
  /\b(?:drown(?:ed|ing)|flood(?:ed|ing)?|swept\s+away)\b/,
  /\b(?:derail(?:ed|ment)?|train\s+accident|bus\s+accident|road\s+accident)\b/,
  /\b(?:murder(?:ed|er|s)?|manslaughter|homicide)\b/,
  /\b(?:robbery|robbed|theft|stolen|hijack(?:ed)?)\b/,
  /\b(?:assault(?:ed)?|attack(?:ed)\s+(?:by|on)|physically\s+attack)\b/,
  /\b(?:shooting|gunfire|gunshot|stabb(?:ed|ing)|explosion|blast(?:ed)?|bomb(?:ing)?)\b/,
  /\b(?:landslide|tsunami)\b/,
  /\bcyclone\s+(?:hits?|strikes?|kills?|caused?|devastat|damage|affect)/,
];

function categorise(text: string): "accidents" | "finance" | "general" {
  const t = text.toLowerCase();

  // ── Finance (checked first to avoid overlap e.g. "market crash") ──────────
  if (FINANCE_PATTERNS.some((pattern) => pattern.test(t))) {
    return "finance";
  }

  // ── Accidents, incidents, crime, disasters ────────────────────────────────
  if (ACCIDENT_PATTERNS.some((pattern) => pattern.test(t))) {
    return "accidents";
  }

  return "general";
}
