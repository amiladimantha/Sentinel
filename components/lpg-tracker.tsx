import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLPGPrices } from "@/lib/api/lpg";

export async function LPGTracker() {
  const prices = await getLPGPrices();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-600">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span>LPG Cylinder Prices</span>
          <Badge variant="outline" className="ml-auto text-xs font-normal text-muted-foreground">
            Govt. Regulated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Flame className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Unable to load LPG prices</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Data will appear on next refresh</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cylinder cards */}
            <div className="grid grid-cols-2 gap-3">
              {prices.map((item) => {
                const diff = item.price - item.previousPrice;
                const pct = item.previousPrice > 0 ? (diff / item.previousPrice) * 100 : 0;
                const up = diff > 0;
                const down = diff < 0;

                return (
                  <div
                    key={item.size}
                    className="rounded-xl border bg-card p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {item.displayName} Cylinder
                      </span>
                      {diff !== 0 && (
                        <Badge
                          variant="secondary"
                          className={`text-xs px-1.5 py-0.5 ${up ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"}`}
                        >
                          {up ? (
                            <TrendingUp className="h-3 w-3 mr-0.5 inline" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-0.5 inline" />
                          )}
                          {up ? "+" : ""}
                          {pct.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold tabular-nums">
                      Rs.{item.price.toLocaleString()}
                    </p>
                    {diff !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        prev. Rs.{item.previousPrice.toLocaleString()}
                      </p>
                    )}
                    {diff === 0 && (
                      <p className="text-xs text-muted-foreground">No recent change</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Provider logos / note */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Applies to:</span>
                <span className="text-xs font-semibold">Litro Gas</span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs font-semibold">Laugfs Gas</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                {prices[0]?.lastUpdated
                  ? `Updated ${prices[0].lastUpdated}`
                  : "Source: Laugfs Gas"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
