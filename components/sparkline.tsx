"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineProps {
  data: { date: string; buying: number }[];
  color?: string;
}

export function Sparkline({ data, color = "#10b981" }: SparklineProps) {
  if (data.length < 2) return <span className="text-[10px] text-muted-foreground">—</span>;

  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="buying"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "10px",
              padding: "2px 6px",
            }}
            formatter={(v) => [`Rs. ${Number(v).toFixed(2)}`, ""]}
            labelFormatter={(l) => l}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
