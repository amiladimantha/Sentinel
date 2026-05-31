"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const LINE_COLORS: Record<string, string> = {
  "Petrol 92": "#3b82f6",
  "Petrol 95": "#8b5cf6",
  "Auto Diesel": "#f59e0b",
  "Super Diesel": "#f97316",
};

interface FuelChartProps {
  chartData: Record<string, string | number>[];
  fuelTypes: string[];
}

export function FuelChart({ chartData, fuelTypes }: FuelChartProps) {
  if (chartData.length < 2) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Price Trend (Ceypetco)
      </h4>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v as string).slice(5)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "11px",
              }}
              formatter={(v) => [`Rs. ${v}`, ""]}
            />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
            {fuelTypes.map((ft) => (
              <Line
                key={ft}
                type="monotone"
                dataKey={ft}
                stroke={LINE_COLORS[ft] ?? "#6b7280"}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
