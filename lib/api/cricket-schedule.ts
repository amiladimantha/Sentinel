const ESPN_SL_SCHEDULE_URL =
  "https://www.espncricinfo.com/team/sri-lanka-8/match-schedule-fixtures-and-results";

import type { RecentCricketMatch } from "@/lib/types";

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
  score: string | null;
  scoreInfo: string | null;
}

interface ESPNMatch {
  objectId: number;
  slug: string;
  stage: string;
  state: string;
  title: string;
  format?: string;
  internationalClassId: number | null;
  generalClassId: number | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  timePublished: boolean;
  statusText: string;
  winnerTeamId: number | null;
  series: { name: string } | null;
  ground: {
    name: string;
    town: { name: string; timezone: string } | null;
  } | null;
  teams: ESPNTeam[];
}

async function getSLScheduleMatches(): Promise<ESPNMatch[]> {
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
  return nextData?.props?.appPageProps?.data?.content?.matches ?? [];
}

function getMatchFormat(match: ESPNMatch): string {
  return (
    match.format ||
    FORMAT_MAP[match.internationalClassId ?? 0] ||
    (match.generalClassId === 6 ? "T20" : "")
  );
}

function getMatchOutcome(match: ESPNMatch): RecentCricketMatch["outcome"] {
  if (match.winnerTeamId === SL_TEAM_ID) return "won";
  if (match.winnerTeamId && match.winnerTeamId !== SL_TEAM_ID) return "lost";

  const status = match.statusText.toLowerCase();
  if (status.includes("no result") || status.includes("abandoned")) return "no-result";
  if (status.includes("draw") || status.includes("tied")) return "draw";
  return "completed";
}

export async function getUpcomingSLMatches(): Promise<UpcomingMatch[]> {
  try {
    const allMatches = await getSLScheduleMatches();

    const upcoming = allMatches.filter(
      (m) => m.stage !== "FINISHED" && m.state !== "POST",
    );

    const matches: UpcomingMatch[] = [];

    for (const m of upcoming) {
      const opponent = m.teams?.find((t) => t.team?.id !== SL_TEAM_ID)?.team;

      matches.push({
        matchId: m.objectId,
        slug: m.slug,
        seriesName: m.series?.name ?? "",
        matchDesc: m.title,
        format: getMatchFormat(m),
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

export async function getLastSLMatch(): Promise<RecentCricketMatch | null> {
  try {
    const allMatches = await getSLScheduleMatches();
    const completed = allMatches
      .filter((m) => m.stage === "FINISHED" || m.state === "POST")
      .sort(
        (a, b) =>
          new Date(b.endDate || b.startTime || b.startDate).getTime() -
          new Date(a.endDate || a.startTime || a.startDate).getTime(),
      );

    const match = completed[0];
    if (!match) return null;

    const sriLanka = match.teams.find((team) => team.team.id === SL_TEAM_ID);
    const opponent = match.teams.find((team) => team.team.id !== SL_TEAM_ID);
    if (!sriLanka || !opponent) return null;

    return {
      matchId: match.objectId,
      slug: match.slug,
      seriesName: match.series?.name ?? "",
      matchDesc: match.title,
      format: getMatchFormat(match),
      startDate: match.startDate,
      startTime: match.timePublished ? match.startTime : null,
      endDate: match.endDate,
      opponent: opponent.team.name,
      opponentShort: opponent.team.abbreviation,
      venue: match.ground?.name ?? "",
      city: match.ground?.town?.name ?? "",
      statusText: match.statusText,
      outcome: getMatchOutcome(match),
      sriLankaScore: sriLanka.score ?? "-",
      sriLankaScoreInfo: sriLanka.scoreInfo ?? "",
      opponentScore: opponent.score ?? "-",
      opponentScoreInfo: opponent.scoreInfo ?? "",
    };
  } catch {
    return null;
  }
}
