"use client";

import { useState, type ReactNode } from "react";
import {
  Zap,
  Landmark,
  Newspaper,
  CloudSun,
  LayoutDashboard,
  Trophy,
} from "lucide-react";

const CATEGORIES = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "finance", label: "Finance", icon: Landmark },
  { id: "news", label: "News", icon: Newspaper },
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "sports", label: "Sports", icon: Trophy },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface DashboardShellProps {
  header: ReactNode;
  overview: ReactNode;
  energy: ReactNode;
  finance: ReactNode;
  news: ReactNode;
  weather: ReactNode;
  sports: ReactNode;
}

export function DashboardShell({
  header,
  overview,
  energy,
  finance,
  news,
  weather,
  sports,
}: DashboardShellProps) {
  const [active, setActive] = useState<CategoryId>("overview");

  const sections: Record<CategoryId, ReactNode> = {
    overview,
    energy,
    finance,
    news,
    weather,
    sports,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Dashboard Header */}
      {header}

      {/* Liquid Glass Category Nav */}
      <nav className="glass-nav sticky top-[57px] z-40 -mx-1 px-1">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`glass-pill group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "glass-pill-active text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span>{cat.label}</span>
                {isActive && (
                  <span className="absolute inset-0 rounded-full ring-1 ring-white/20" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Section */}
      <div className="space-y-4">{sections[active]}</div>
    </div>
  );
}
