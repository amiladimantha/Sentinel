"use client";

import { Activity, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useLanguage } from "@/lib/i18n/provider";

export function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
            <Activity className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-tight">
              {t.appName}
            </span>
            <span className="text-[10px] text-indigo-300/70 leading-none hidden sm:block">
              Sri Lanka Dashboard
            </span>
          </div>
        </div>

        {/* Center: Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 border border-white/10">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse-slow" />
          <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Right side: Notifications + Theme toggle */}
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
