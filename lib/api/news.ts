import type { NewsItem } from "@/lib/types";

const ADA_DERANA_RSS = "https://www.adaderana.lk/rss.php";

/**
 * Fetch latest news from Ada Derana's RSS feed.
 * Parses XML manually (no external deps).
 * Falls back to empty array on failure.
 */
export async function getNewsItems(
  category?: "accidents" | "finance" | "general"
): Promise<NewsItem[]> {
  try {
    const res = await fetch(ADA_DERANA_RSS, { next: { revalidate: 900 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const items: NewsItem[] = [];

    // Parse RSS <item> blocks
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;
    let id = 1;

    while ((match = itemPattern.exec(xml)) !== null && items.length < 15) {
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
        id: String(id++),
        title,
        summary: summary || title,
        imageUrl,
        category: cat,
        source: "Ada Derana",
        url: link || "#",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }

    if (category) {
      return items.filter((item) => item.category === category);
    }
    return items;
  } catch {
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function categorise(text: string): "accidents" | "finance" | "general" {
  const t = text.toLowerCase();

  // ── Finance (checked first to avoid overlap e.g. "market crash") ──────────
  if (
    /\b(?:rupee|dollar|euro|sterling|forex)\b/.test(t) ||
    /us\$|usd\b|\$\s*\d/.test(t) ||
    /\b(?:million|billion)\s+(?:dollar|grant|loan|aid|fund|rupee)/.test(t) ||
    /\b(?:grant|aid\s+package|financial\s+aid|foreign\s+aid)\b/.test(t) ||
    /\b(?:stock\s+(?:market|exchange)|colombo\s+stock|cse\b|share\s+price)\b/.test(t) ||
    /\b(?:inflation|deflation|gdp|imf|world\s+bank|central\s+bank)\b/.test(t) ||
    /\b(?:interest\s+rate|exchange\s+rate|lending\s+rate|bank\s+rate)\b/.test(t) ||
    /\b(?:budget|fiscal|monetary|treasury|bond|tariff|customs\s+duty)\b/.test(t) ||
    /\b(?:export|import|trade\s+(?:deficit|surplus|balance))\b/.test(t) ||
    /\b(?:economic|economy|investment|finance\s+minister|finance\s+ministry)\b/.test(t) ||
    /\b(?:loan|debt|credit\s+rating|foreign\s+(?:exchange|reserves?|debt))\b/.test(t) ||
    /\b(?:revenue|tax(?:ation)?|vat\b|customs|excise)\b/.test(t)
  ) {
    return "finance";
  }

  // ── Accidents, incidents, crime, disasters ────────────────────────────────
  if (
    // clear accident words
    /\baccident\b/.test(t) ||
    /\b(?:crash(?:es|ed)?|collision|collide[sd]?)\b/.test(t) ||
    /\b(?:injur(?:ed|ies|y)|hospitaliz(?:ed|ation))\b/.test(t) ||
    // death with strong signal — require "died", "killed", "death toll" etc.
    /\b(?:died|death\s+toll|death\s+of|killed\s+in|found\s+dead|dead\s+bod(?:y|ies))\b/.test(t) ||
    // physical fire events only
    /\b(?:caught\s+fire|house\s+fire|building\s+(?:fire|blaze)|factory\s+fire|fire\s+(?:destroyed|killed|breaks?\s+out|breaks?\s+in|accident|truck|engine)|blaze\s+(?:at|in|kills?)|arson)\b/.test(t) ||
    // drowning / flood
    /\b(?:drown(?:ed|ing)|flood(?:ed|ing)?|swept\s+away)\b/.test(t) ||
    // rail / road disasters
    /\b(?:derail(?:ed|ment)?|train\s+accident|bus\s+accident|road\s+accident)\b/.test(t) ||
    // crime
    /\b(?:murder(?:ed|er|s)?|manslaughter|homicide)\b/.test(t) ||
    /\b(?:robbery|robbed|theft|stolen|hijack(?:ed)?)\b/.test(t) ||
    /\b(?:assault(?:ed)?|attack(?:ed)\s+(?:by|on)|physically\s+attack)\b/.test(t) ||
    /\b(?:shooting|gunfire|gunshot|stabb(?:ed|ing)|explosion|blast(?:ed)?|bomb(?:ing)?)\b/.test(t) ||
    // natural disasters — require event context, not just a mention
    /\b(?:landslide|tsunami)\b/.test(t) ||
    /\bcyclone\s+(?:hits?|strikes?|kills?|caused?|devastat|damage|affect)/i.test(t)
  ) {
    return "accidents";
  }

  return "general";
}
