"use client";

import { useState } from "react";
import { Zap, Calculator } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ElectricityTariff, ElectricityHikeHistory } from "@/lib/types";

interface ElectricityMonitorProps {
  tariffs: ElectricityTariff[];
  hikeHistory: ElectricityHikeHistory[];
}

const BAR_COLORS = [
  "#fbbf24",
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
];

export function ElectricityMonitor({
  tariffs,
  hikeHistory,
}: ElectricityMonitorProps) {
  const [kwhInput, setKwhInput] = useState("");

  const estimatedBill = (() => {
    const kwh = parseFloat(kwhInput);
    if (!kwh || kwh <= 0 || tariffs.length === 0) return null;

    // Determine which consumption scheme applies per PUCSL tariff (Annex 2)
    const schemeKey = kwh <= 60 ? "low" : kwh <= 180 ? "mid" : "high";

    // Get blocks for the active scheme, sorted by min unit
    const blocks = tariffs
      .filter((t) => t.scheme === schemeKey)
      .map((t) => {
        const rangeM = t.units.match(/(\d+)\s*[-–]\s*(\d+)/);
        const openM = t.units.match(/(\d+)\+/);
        if (!rangeM && !openM) return null;
        return {
          min: rangeM ? parseInt(rangeM[1]) : parseInt(openM![1]),
          max: rangeM ? parseInt(rangeM[2]) : Infinity,
          rate: t.rate,
          fixedCharge: t.fixedCharge ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.min - b!.min) as {
        min: number;
        max: number;
        rate: number;
        fixedCharge: number;
      }[];

    let remaining = kwh;
    let energyTotal = 0;
    // Fixed charge = single charge for the HIGHEST band reached (not cumulative)
    let applicableFixedCharge = 0;

    for (const block of blocks) {
      const blockSize =
        block.max === Infinity
          ? remaining
          : block.max - Math.max(block.min - 1, 0);
      const units = Math.min(remaining, blockSize);
      if (units <= 0) break;
      energyTotal += units * block.rate;
      if (block.fixedCharge > 0) applicableFixedCharge = block.fixedCharge;
      remaining -= units;
    }
    if (remaining > 0 && blocks.length > 0) {
      energyTotal += remaining * blocks[blocks.length - 1].rate;
    }

    return {
      energy: energyTotal,
      fixed: applicableFixedCharge,
      total: energyTotal + applicableFixedCharge,
      schemeLabel:
        schemeKey === "low"
          ? "≤60 kWh scheme"
          : schemeKey === "mid"
            ? "61–180 kWh scheme"
            : ">180 kWh scheme",
    };
  })();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span>Electricity Monitor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current tariffs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Tariffs
            </h4>
            {tariffs[0]?.effectiveDate && (
              <span className="text-[10px] text-muted-foreground">
                Effective {tariffs[0].effectiveDate}
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {tariffs
              .filter((t) => t.scheme === "mid")
              .map((tariff, i) => {
              const pct = Math.min((tariff.rate / 60) * 100, 100);
              return (
                <div
                  key={tariff.category}
                  className="relative overflow-hidden rounded-xl border dark:border-amber-900 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-transparent p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {tariff.units}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        Rs. {tariff.rate.toFixed(2)}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /kWh
                        </span>
                      </span>
                      {(tariff.fixedCharge ?? 0) > 0 && (
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          + Rs. {(tariff.fixedCharge!).toLocaleString()} fixed
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Source:{" "}
            <a
              href="https://www.pucsl.gov.lk/calculator/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              PUCSL Approved Tariff
            </a>{" "}
            · 61–180 kWh scheme shown
          </p>
        </div>

        {/* Bill calculator */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calculator className="h-3 w-3" />
            Bill Calculator
          </h4>
          <div className="rounded-xl border dark:border-amber-900 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-transparent p-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Enter monthly kWh"
                value={kwhInput}
                onChange={(e) => setKwhInput(e.target.value)}
                className="flex-1 rounded-lg border bg-white dark:bg-white/5 px-3 py-1.5 text-sm tabular-nums outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <span className="text-xs text-muted-foreground">kWh</span>
            </div>
            {estimatedBill !== null && (
              <div className="space-y-1.5 rounded-lg bg-white/80 dark:bg-white/5 px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {estimatedBill.schemeLabel}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Energy charge</span>
                  <span className="tabular-nums">Rs. {estimatedBill.energy.toFixed(2)}</span>
                </div>
                {estimatedBill.fixed > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Fixed service charge</span>
                    <span className="tabular-nums">Rs. {estimatedBill.fixed.toLocaleString()}.00</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-1.5 dark:border-amber-900/50">
                  <span className="text-xs text-muted-foreground">Estimated Bill</span>
                  <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    Rs. {estimatedBill.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price hike history chart */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Price Hike History
          </h4>
          {hikeHistory.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
              No hike history yet — data will appear after the next tariff change
            </div>
          ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={hikeHistory}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    `Rs. ${value}/kWh`,
                    "Avg Rate",
                  ]}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {hikeHistory.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
