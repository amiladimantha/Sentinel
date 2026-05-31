import { Clock, Fuel, TrendingUp, TrendingDown, Droplets } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFuelPrices } from "@/lib/api/fuel";
import { FuelChart } from "@/components/fuel-chart";

const FUEL_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  "Petrol 92": {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-500",
  },
  "Petrol 95": {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    icon: "text-violet-500",
  },
  "Auto Diesel": {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  "Super Diesel": {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-500 dark:text-orange-400",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function FuelTracker() {
  const prices = await getFuelPrices();

  const fuelTypes = Array.from(new Set(prices.map((p) => p.fuelType)));
  const lastUpdated = prices[0]?.lastUpdated;

  // Build chart data: one point per date, keyed by fuel type (Ceypetco only)
  const chartDataMap = new Map<string, Record<string, string | number>>();
  for (const p of prices) {
    if (p.provider !== "Ceypetco") continue;
    for (const h of p.history) {
      const entry: Record<string, string | number> = chartDataMap.get(h.date) ?? { date: h.date };
      entry[p.fuelType] = h.price;
      chartDataMap.set(h.date, entry);
    }
  }
  const chartData = Array.from(chartDataMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-500">
              <Fuel className="h-4 w-4 text-white" />
            </div>
            <span>Fuel Price Tracker</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {lastUpdated ? formatDate(lastUpdated) : "—"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {prices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Fuel className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Unable to load fuel prices</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Data will appear on next refresh</p>
          </div>
        ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {fuelTypes.map((fuelType) => {
            const items = prices.filter((p) => p.fuelType === fuelType);
            const colors = FUEL_COLORS[fuelType] ?? {
              bg: "bg-gray-50 dark:bg-gray-900/40",
              border: "border-gray-200 dark:border-gray-700",
              icon: "text-gray-500",
            };
            return (
              <div
                key={fuelType}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-3.5 space-y-2.5 transition-transform hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className={`h-4 w-4 ${colors.icon}`} />
                  <h4 className="text-sm font-semibold">{fuelType}</h4>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const diff = item.price - item.previousPrice;
                    const isUp = diff > 0;
                    return (
                      <div
                        key={`${item.fuelType}-${item.provider}`}
                        className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-white/5 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.provider}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums">
                            Rs. {item.price.toFixed(2)}
                          </span>
                          {diff !== 0 && (
                            <Badge
                              variant={isUp ? "destructive" : "secondary"}
                              className="flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full"
                            >
                              {isUp ? (
                                <TrendingUp className="h-2.5 w-2.5" />
                              ) : (
                                <TrendingDown className="h-2.5 w-2.5" />
                              )}
                              {isUp ? "+" : ""}
                              {diff.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Price trend chart */}
        <FuelChart chartData={chartData} fuelTypes={fuelTypes} />
      </CardContent>
    </Card>
  );
}
