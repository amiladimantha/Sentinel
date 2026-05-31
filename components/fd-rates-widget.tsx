import { Landmark, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFDRates } from "@/lib/api/fd-rates";

const TENORS: { key: "3m" | "6m" | "12m" | "24m"; label: string }[] = [
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "12m", label: "1Y" },
  { key: "24m", label: "2Y" },
];

export async function FDRatesWidget() {
  const data = await getFDRates();

  const formattedDate = data.lastVerified
    ? new Date(data.lastVerified).toLocaleDateString("en-LK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Landmark className="h-4 w-4 text-white" />
          </div>
          <span>FD Rates</span>
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">% p.a.</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.banks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-lg border overflow-hidden text-xs">
              {/* Header */}
              <div className="grid grid-cols-5 bg-muted/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-1">Bank</span>
                {TENORS.map((t) => (
                  <span key={t.key} className="text-center">{t.label}</span>
                ))}
              </div>
              {/* Rows */}
              <div className="divide-y">
                {data.banks.map((bank) => (
                  <div
                    key={bank.shortName}
                    className="grid grid-cols-5 px-3 py-2 hover:bg-muted/30 transition-colors items-center"
                  >
                    <span className="font-semibold text-foreground text-[11px]">{bank.shortName}</span>
                    {TENORS.map((t) => {
                      const rate = bank.rates[t.key];
                      return (
                        <span
                          key={t.key}
                          className="text-center tabular-nums font-medium text-foreground"
                        >
                          {rate != null ? `${rate.toFixed(2)}%` : "—"}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-2.5 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Indicative rates
                {formattedDate ? ` updated ${formattedDate}` : ""}. Always verify
                directly with the bank before investing.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
