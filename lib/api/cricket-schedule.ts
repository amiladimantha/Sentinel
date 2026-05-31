const ESPN_SL_SCHEDULE_URL =
  "https://www.espncricinfo.com/team/sri-lanka-8/match-schedule-fixtures-and-results";

const SL_TEAM_ID = 8;

const FORMAT_MAP: Record<number, string> = {
  1: "TEST",
  2: "ODI",
  3: "T20I",
};

export interface UpcomingMatch {
  matchId: number;
  slug: string;
  seriesName: string;
  matchDesc: string;
  format: string;
  startTime: string | null; // ISO string with actual time, null if not published
  startDate: string; // ISO date string
  isTimeAnnounced: boolean;
  opponent: string;
  opponentShort: string;
  venue: string;
  city: string;
}

interface ESPNTeam {
  team: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

interface ESPNMatch {
  objectId: number;
  slug: string;
  stage: string;
  state: string;
  title: string;
  internationalClassId: number | null;
  generalClassId: number | null;
  startDate: string;
  startTime: string | null;
  timePublished: boolean;
  series: { name: string } | null;
  ground: {
    name: string;
    town: { name: string; timezone: string } | null;
  } | null;
  teams: ESPNTeam[];
}

export async function getUpcomingSLMatches(): Promise<UpcomingMatch[]> {
  try {
    const res = await fetch(ESPN_SL_SCHEDULE_URL, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];

    const html = await res.text();

    const scriptMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!scriptMatch) return [];

    const nextData = JSON.parse(scriptMatch[1]);
    const allMatches: ESPNMatch[] =
      nextData?.props?.appPageProps?.data?.content?.matches ?? [];

    const upcoming = allMatches.filter(
      (m) => m.stage !== "FINISHED" && m.state !== "POST",
    );

    const matches: UpcomingMatch[] = [];

    for (const m of upcoming) {
      const opponent = m.teams?.find((t) => t.team?.id !== SL_TEAM_ID)?.team;

      const format =
        FORMAT_MAP[m.internationalClassId ?? 0] ??
        (m.generalClassId === 6 ? "T20" : "");

      matches.push({
        matchId: m.objectId,
        slug: m.slug,
        seriesName: m.series?.name ?? "",
        matchDesc: m.title,
        format,
        startDate: m.startDate,
        startTime: m.timePublished ? m.startTime : null,
        isTimeAnnounced: m.timePublished,
        opponent: opponent?.name ?? "TBD",
        opponentShort: opponent?.abbreviation ?? "TBD",
        venue: m.ground?.name ?? "",
        city: m.ground?.town?.name ?? "",
      });
    }

    matches.sort(
      (a, b) =>
        new Date(a.startTime ?? a.startDate).getTime() -
        new Date(b.startTime ?? b.startDate).getTime(),
    );

    return matches;
  } catch {
    return [];
  }
}
