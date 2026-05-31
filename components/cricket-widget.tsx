import { ExternalLink, CircleDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSriLankaCricket } from "@/lib/api/cricket";

/** Parse a Cricinfo live score string like:
 *  "Sri Lanka 245/6 * v India 312/8"
 *  into a structured display
 */
function parseScore(raw: string) {
  // Split on " v " to get both teams
  const parts = raw.split(/\sv\s/i);
  if (parts.length !== 2) return { raw };

  const format = (s: string) => {
    const batting = s.trim().endsWith("*");
    return { text: s.trim().replace(/\s*\*\s*$/, ""), batting };
  };

  return { team1: format(parts[0]), team2: format(parts[1]) };
}

export async function CricketWidget() {
  const matches = await getSriLankaCricket();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <span className="text-base">🏏</span>
          </div>
          <span>Cricket</span>
          {matches.length > 0 && (
            <Badge className="ml-auto bg-red-500/15 text-red-500 dark:text-red-400 border-red-300/30 text-[10px] flex items-center gap-1">
              <CircleDot className="h-2.5 w-2.5 animate-pulse" />
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <span className="text-3xl">🏏</span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No Sri Lanka match live</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Check back when SL is playing
              </p>
            </div>
            <a
              href="https://www.espncricinfo.com/cricket-teams/sri-lanka-4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              SL schedule on ESPNcricinfo
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match, i) => {
              const parsed = parseScore(match.title);
              return (
                <a
                  key={i}
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  {parsed.team1 && parsed.team2 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm tabular-nums ${
                            parsed.team1.batting ? "font-bold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {parsed.team1.text}
                        </span>
                        {parsed.team1.batting && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">
                            batting
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm tabular-nums ${
                            parsed.team2.batting ? "font-bold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {parsed.team2.text}
                        </span>
                        {parsed.team2.batting && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">
                            batting
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{match.title}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <span>ESPNcricinfo</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
