"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExchangeRate } from "@/lib/types";

const CURRENCY_FLAGS: Record<string, string> = {
  LKR: "🇱🇰",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  INR: "🇮🇳",
  AUD: "🇦🇺",
  SAR: "🇸🇦",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
};

interface Props {
  rates: ExchangeRate[];
}

/**
 * Convert between LKR and foreign currencies (or between two foreign currencies
 * via LKR cross-rate) using live exchange rate data already in the app.
 *
 * Rate conventions:
 *   buyingRate  = bank buys foreign currency from you → you receive LKR
 *   sellingRate = bank sells foreign currency to you → you pay LKR
 * For cross-pair conversions we use the mid-rate to keep it simple.
 */
export function CurrencyConverter({ rates }: Props) {
  const [amount, setAmount] = useState<string>("1");
  const [fromCode, setFromCode] = useState<string>("USD");
  const [toCode, setToCode] = useState<string>("LKR");

  // Build a lookup map: code → { buying, selling, mid }
  const rateMap = useMemo(() => {
    const m = new Map<string, { buying: number; selling: number; mid: number }>();
    // LKR is the base — 1 LKR = 1 LKR
    m.set("LKR", { buying: 1, selling: 1, mid: 1 });
    for (const r of rates) {
      m.set(r.code, {
        buying: r.buyingRate,
        selling: r.sellingRate,
        mid: (r.buyingRate + r.sellingRate) / 2,
      });
    }
    return m;
  }, [rates]);

  const currencies = useMemo(
    () => ["LKR", ...rates.map((r) => r.code)],
    [rates]
  );

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return null;

    const from = rateMap.get(fromCode);
    const to = rateMap.get(toCode);
    if (!from || !to) return null;

    if (fromCode === toCode) return num;

    let lkrAmount: number;

    if (fromCode === "LKR") {
      // Selling: bank sells foreign to you — you pay LKR
      lkrAmount = num;
    } else if (toCode === "LKR") {
      // Buying: bank buys foreign from you — you get LKR
      return num * from.buying;
    } else {
      // Cross-pair: foreign → LKR (buying) → foreign (selling)
      lkrAmount = num * from.buying;
    }

    // LKR → foreign
    return lkrAmount / to.selling;
  }, [amount, fromCode, toCode, rateMap]);

  function handleSwap() {
    setFromCode(toCode);
    setToCode(fromCode);
  }

  const formatted =
    result === null
      ? "—"
      : result >= 1000
        ? result.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : result.toFixed(toCode === "JPY" ? 0 : 4);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-purple-600">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <span>Currency Converter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Amount
          </label>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-semibold tabular-nums"
            placeholder="Enter amount"
          />
        </div>

        {/* From / Swap / To */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              From
            </label>
            <Select value={fromCode} onValueChange={(v) => v !== null && setFromCode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    <span className="mr-2">{CURRENCY_FLAGS[code] ?? "🏳️"}</span>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleSwap}
            className="mb-px flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border bg-muted hover:bg-muted/80 transition-colors"
            title="Swap currencies"
            aria-label="Swap currencies"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              To
            </label>
            <Select value={toCode} onValueChange={(v) => v !== null && setToCode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    <span className="mr-2">{CURRENCY_FLAGS[code] ?? "🏳️"}</span>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {CURRENCY_FLAGS[fromCode] ?? ""} {amount || "0"} {fromCode} =
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {CURRENCY_FLAGS[toCode] ?? ""} {formatted}{" "}
            <span className="text-lg font-medium text-muted-foreground">{toCode}</span>
          </p>
          {fromCode !== toCode && result !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              1 {fromCode} ={" "}
              {fromCode === "LKR"
                ? `${(1 / (rateMap.get(toCode)?.selling ?? 1)).toFixed(6)} ${toCode}`
                : `Rs.${(rateMap.get(fromCode)?.buying ?? 0).toFixed(2)}`}
              {" · "}
              <span className="italic">Live bank rates</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
