import type { PublicHoliday } from "@/lib/types";

const NAGER_BASE = "https://date.nager.at/api/v3/PublicHolidays";

interface NagerHoliday {
  date: string; // "YYYY-MM-DD"
  name: string;
  localName: string;
  global: boolean;
}

async function fetchHolidaysForYear(year: number): Promise<NagerHoliday[]> {
  const res = await fetch(`${NAGER_BASE}/${year}/LK`, {
    next: { revalidate: 86400 }, // cache for 24 hours
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getNextHoliday(): Promise<PublicHoliday | null> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();

  try {
    let holidays = await fetchHolidaysForYear(year);

    // Filter to upcoming (today or later)
    let upcoming = holidays.filter((h) => h.date >= todayStr);

    // If no upcoming in this year, check next year
    if (upcoming.length === 0) {
      holidays = await fetchHolidaysForYear(year + 1);
      upcoming = holidays;
    }

    if (upcoming.length === 0) return null;

    // Sort ascending and take the nearest
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    const next = upcoming[0];

    const diffMs = new Date(next.date).getTime() - new Date(todayStr).getTime();
    const daysUntil = Math.ceil(diffMs / 86_400_000);

    return { name: next.localName || next.name, date: next.date, daysUntil };
  } catch {
    return null;
  }
}

