import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUpcomingSLMatches } from "@/lib/api/cricket-schedule";

const FORMAT_COLORS: Record<string, string> = {
  TEST: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-300/30",
  ODI: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300/30",
  T20: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300/30",
  T20I: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300/30",
};

function formatMatchDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-LK", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Colombo",
  });
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  });
}

export async function UpcomingMatches() {
  const matches = await getUpcomingSLMatches();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span>Upcoming Matches</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No upcoming SL matches scheduled
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Check back for future fixtures
              </p>
            </div>
          </div>
        ) : (
          <>
            {matches.length > 0 && (
              <p className="text-xs text-muted-foreground mb-1">
                {matches[0].seriesName}
              </p>
            )}
            {matches.map((match) => (
              <a
                key={match.matchId}
                href={`https://www.espncricinfo.com/match/${match.slug}-${match.matchId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        SL vs {match.opponentShort}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${FORMAT_COLORS[match.format] ?? ""}`}
                      >
                        {match.format}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {match.matchDesc}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {match.venue}
                        {match.city ? `, ${match.city}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">
                      {formatMatchDate(match.startTime ?? match.startDate)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {match.isTimeAnnounced
                        ? formatMatchTime(match.startTime!)
                        : "Time TBA"}
                    </p>
                  </div>
                </div>
              </a>
            ))}
            <a
              href="https://www.espncricinfo.com/team/sri-lanka-8/match-schedule-fixtures-and-results"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
            >
              Full schedule on ESPNcricinfo
              <ExternalLink className="h-3 w-3" />
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
