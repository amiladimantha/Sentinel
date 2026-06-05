import { FuelTracker } from "@/components/fuel-tracker";
import { NewsFeed } from "@/components/news-feed";
import { ElectricityMonitor } from "@/components/electricity-monitor";
import { ExchangeRates } from "@/components/exchange-rates";
import { DisasterAlerts } from "@/components/disaster-alerts";
import { TrafficFeed } from "@/components/traffic-feed";
import { WaterNotices } from "@/components/water-notices";
import { HealthBanner } from "@/components/health-banner";
import { HolidayCountdown } from "@/components/holiday-countdown";
import { RefreshCountdown } from "@/components/refresh-countdown";
import { LPGTracker } from "@/components/lpg-tracker";
import { CurrencyConverterServer } from "@/components/currency-converter-server";
import { LoadShedding } from "@/components/load-shedding";
import { WeatherWidgetServer } from "@/components/weather-widget-server";
import { CricketWidget } from "@/components/cricket-widget";
import { LastMatchCard } from "@/components/last-match-card";
import { UpcomingMatches } from "@/components/upcoming-matches";
import { FDRatesWidget } from "@/components/fd-rates-widget";
import { RiskMapServer } from "@/components/risk-map-server";
import { DashboardShell } from "@/components/dashboard-shell";
import { getNewsItems } from "@/lib/api/news";
import {
  getElectricityTariffs,
  getElectricityHikeHistory,
} from "@/lib/api/electricity";

// ISR: Revalidate every 15 minutes (900 seconds)
export const revalidate = 900;

export default async function Home() {
  const [news, tariffs, hikeHistory] = await Promise.all([
    getNewsItems(),
    getElectricityTariffs(),
    getElectricityHikeHistory(),
  ]);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <DashboardShell
      header={
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening across Sri Lanka today &mdash;{" "}
              <time className="font-medium">
                {now.toLocaleDateString("en-LK", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RefreshCountdown />
            <HolidayCountdown />
          </div>
        </div>
      }
      overview={
        <>
          <HealthBanner />
          <DisasterAlerts />
          {/* Quick glance: one card from each category */}
          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <FuelTracker />
            <ExchangeRates />
            <WeatherWidgetServer />
          </div>
        </>
      }
      energy={
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col gap-4">
            <FuelTracker />
            <LPGTracker />
          </div>
          <ElectricityMonitor tariffs={tariffs} hikeHistory={hikeHistory} />
          <LoadShedding />
        </div>
      }
      finance={
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <ExchangeRates />
          <CurrencyConverterServer />
          <FDRatesWidget />
        </div>
      }
      news={
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <NewsFeed initialNews={news} />
          </div>
          <div className="flex flex-col gap-4">
            <TrafficFeed />
            <WaterNotices />
          </div>
        </div>
      }
      weather={
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <WeatherWidgetServer />
          <RiskMapServer />
        </div>
      }
      sports={
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <CricketWidget />
          <LastMatchCard />
          <UpcomingMatches />
        </div>
      }
    />
  );
}
