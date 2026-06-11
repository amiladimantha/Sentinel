"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const REVALIDATE_SECONDS = 900; // 15 minutes
const AUTO_REFRESH_ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_AUTO_REFRESH === "true";

export function RefreshCountdown() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REVALIDATE_SECONDS);

  useEffect(() => {
    if (!AUTO_REFRESH_ENABLED) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          router.refresh();
          return REVALIDATE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleClick = () => {
    router.refresh();
    setSecondsLeft(REVALIDATE_SECONDS);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
      title="Click to refresh now"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="tabular-nums font-medium">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
      <RefreshCw className="h-3 w-3" />
    </button>
  );
}
