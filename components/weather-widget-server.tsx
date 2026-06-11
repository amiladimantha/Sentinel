import { getWeather } from "@/lib/api/weather";
import { WeatherWidget } from "@/components/weather-widget";
import type { WeatherCity } from "@/lib/types";

interface WeatherWidgetServerProps {
  defaultCities?: WeatherCity[];
}

export async function WeatherWidgetServer({ defaultCities: initialDefaultCities }: WeatherWidgetServerProps = {}) {
  const defaultCities = initialDefaultCities ?? await getWeather(); // fetches default 4 cities

  return <WeatherWidget defaultCities={defaultCities} />;
}
