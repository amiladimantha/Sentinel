import { CalendarDays, ExternalLink, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLastSLMatch } from "@/lib/api/cricket-schedule";

const OUTCOME_STYLES = {
  won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300/30",
  lost: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300/30",
  draw: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300/30",
  "no-result": "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300/30",
  completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300/30",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}

export async function LastMatchCard() {
  const match = await getLastSLMatch();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <span>Last SL Match</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!match ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
            <span className="text-3xl">🏏</span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No recent match found</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Result data will appear after SL fixtures are posted
              </p>
            </div>
          </div>
        ) : (
          <a
            href={`https://www.espncricinfo.com/match/${match.slug}-${match.matchId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20 p-3 hover:bg-orange-50/80 dark:hover:bg-orange-950/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground line-clamp-1">{match.seriesName}</p>
                <p className="text-sm font-semibold mt-1">Sri Lanka vs {match.opponentShort}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{match.matchDesc}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {match.format}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${OUTCOME_STYLES[match.outcome]}`}
                >
                  {match.outcome === "no-result" ? "No Result" : match.outcome}
                </Badge>
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Sri Lanka</p>
                  {match.sriLankaScoreInfo && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{match.sriLankaScoreInfo}</p>
                  )}
                </div>
                <p className="text-sm font-bold tabular-nums">{match.sriLankaScore}</p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{match.opponent}</p>
                  {match.opponentScoreInfo && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{match.opponentScoreInfo}</p>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums text-muted-foreground">{match.opponentScore}</p>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-foreground">{match.statusText}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(match.endDate || match.startDate)}
              </span>
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {match.venue}
                  {match.city ? `, ${match.city}` : ""}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-primary">
                Scorecard
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </a>
        )}
      </CardContent>
    </Card>
  );
}