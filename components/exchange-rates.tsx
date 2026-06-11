import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/sparkline";
import { getExchangeRates } from "@/lib/api/exchange-rates";
import type { ExchangeRate } from "@/lib/types";

interface ExchangeRatesProps {
  rates?: ExchangeRate[];
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  INR: "🇮🇳",
  AUD: "🇦🇺",
  SAR: "🇸🇦",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
};

export async function ExchangeRates({ rates: initialRates }: ExchangeRatesProps = {}) {
  const rates = initialRates ?? await getExchangeRates();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600">
            <ArrowLeftRight className="h-4 w-4 text-white" />
          </div>
          <span>Exchange Rates</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Unable to load exchange rates</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Data will appear on next refresh</p>
          </div>
        ) : (
        <div className="overflow-x-auto -mx-2 px-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[140px] text-xs">Currency</TableHead>
              <TableHead className="text-right text-xs">Buying (LKR)</TableHead>
              <TableHead className="text-right text-xs">Selling (LKR)</TableHead>
              <TableHead className="text-right text-xs">7d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => {
              const buyDiff = parseFloat((rate.buyingRate - rate.previousBuyingRate).toFixed(2));
              const sellDiff = parseFloat((rate.sellingRate - rate.previousSellingRate).toFixed(2));

              return (
                <TableRow
                  key={rate.code}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CURRENCY_FLAGS[rate.code]}</span>
                      <div>
                        <span className="font-semibold text-sm">{rate.code}</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">
                          {rate.currency}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">
                    <div className="flex flex-col items-end">
                      <span>{rate.buyingRate.toFixed(2)}</span>
                      {buyDiff !== 0 && (
                        <Badge
                          variant={buyDiff > 0 ? "default" : "destructive"}
                          className="mt-0.5 text-[9px] px-1 py-0 h-4 gap-0.5"
                        >
                          {buyDiff > 0 ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {buyDiff > 0 ? "+" : ""}{buyDiff.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">
                    <div className="flex flex-col items-end">
                      <span>{rate.sellingRate.toFixed(2)}</span>
                      {sellDiff !== 0 && (
                        <Badge
                          variant={sellDiff > 0 ? "default" : "destructive"}
                          className="mt-0.5 text-[9px] px-1 py-0 h-4 gap-0.5"
                        >
                          {sellDiff > 0 ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {sellDiff > 0 ? "+" : ""}{sellDiff.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Sparkline
                      data={rate.history}
                      color={buyDiff > 0 ? "#ef4444" : buyDiff < 0 ? "#10b981" : "#6b7280"}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground border-t pt-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Source: Open Exchange Rates API
        </div>
      </CardContent>
    </Card>
  );
}
