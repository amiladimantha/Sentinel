import { CalendarDays } from "lucide-react";
import { getNextHoliday } from "@/lib/api/holidays";

export async function HolidayCountdown() {
  const holiday = await getNextHoliday();
  if (!holiday) return null;

  const { name, date, daysUntil } = holiday;
  const formattedDate = new Date(date).toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 px-3 py-1.5 text-xs">
      <CalendarDays className="h-3.5 w-3.5 text-violet-500 shrink-0" />
      <span className="text-muted-foreground">Next holiday:</span>
      <span className="font-semibold text-violet-700 dark:text-violet-300 truncate max-w-[180px]">
        {name}
      </span>
      <span className="text-muted-foreground shrink-0">{formattedDate}</span>
      {daysUntil === 0 ? (
        <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] text-white font-semibold shrink-0">
          Today!
        </span>
      ) : (
        <span className="rounded-full bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 text-[10px] text-violet-700 dark:text-violet-300 font-semibold shrink-0">
          {daysUntil}d
        </span>
      )}
    </div>
  );
}
