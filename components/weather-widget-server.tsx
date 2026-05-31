import { getWeather } from "@/lib/api/weather";
import { WeatherWidget } from "@/components/weather-widget";

export async function WeatherWidgetServer() {
  const defaultCities = await getWeather(); // fetches default 4 cities

  return <WeatherWidget defaultCities={defaultCities} />;
}
