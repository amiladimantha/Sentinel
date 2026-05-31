import type { WaterNotice } from "@/lib/types";

const NWSDB_API =
  "https://www.waterboard.lk/wp-json/wp/v2/posts?per_page=5&categories=51&_fields=id,title,date,link";

interface WPPost {
  id: number;
  title: { rendered: string };
  date: string;
  link: string;
}

export async function getWaterNotices(): Promise<WaterNotice[]> {
  try {
    const res = await fetch(NWSDB_API, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const posts: WPPost[] = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts.slice(0, 5).map((p) => ({
      id: `nwsdb-${p.id}`,
      title: p.title.rendered
        .replace(/&#8217;/g, "'")
        .replace(/&#038;/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#8211;/g, "–"),
      url: p.link,
      publishedAt: p.date,
      source: "NWSDB" as const,
    }));
  } catch {
    return [];
  }
}
