import type { WeatherCity } from "@/lib/types";

export const ALL_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { name: "Kandy", lat: 7.2906, lon: 80.6337 },
  { name: "Galle", lat: 6.0535, lon: 80.221 },
  { name: "Jaffna", lat: 9.6615, lon: 80.0255 },
  { name: "Matara", lat: 5.9549, lon: 80.5550 },
  { name: "Negombo", lat: 7.2094, lon: 79.8358 },
  { name: "Trincomalee", lat: 8.5874, lon: 81.2152 },
  { name: "Batticaloa", lat: 7.7170, lon: 81.7000 },
  { name: "Anuradhapura", lat: 8.3114, lon: 80.4037 },
  { name: "Kurunegala", lat: 7.4863, lon: 80.3623 },
  { name: "Ratnapura", lat: 6.6828, lon: 80.3992 },
  { name: "Nuwara Eliya", lat: 6.9497, lon: 80.7891 },
  { name: "Badulla", lat: 6.9934, lon: 81.0550 },
  { name: "Hambantota", lat: 6.1240, lon: 81.1185 },
  { name: "Polonnaruwa", lat: 7.9390, lon: 81.0014 },
  { name: "Ampara", lat: 7.2975, lon: 81.6720 },
  { name: "Matale", lat: 7.4675, lon: 80.6234 },
  { name: "Kalutara", lat: 6.5854, lon: 79.9607 },
  { name: "Chilaw", lat: 7.5758, lon: 79.7953 },
  { name: "Vavuniya", lat: 8.7514, lon: 80.4971 },
];

const PARAMS =
  "current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m&timezone=Asia%2FColombo";

export async function getWeather(cityNames?: string[]): Promise<WeatherCity[]> {
  const cities = cityNames
    ? ALL_CITIES.filter((c) => cityNames.includes(c.name))
    : ALL_CITIES.slice(0, 4); // default: first 4

  try {
    const results = await Promise.all(
      cities.map(({ name, lat, lon }) =>
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${PARAMS}`,
          { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) }
        )
          .then((r) => r.json())
          .then((d) => ({
            city: name,
            temp: Math.round(d.current.temperature_2m),
            humidity: d.current.relative_humidity_2m,
            weatherCode: d.current.weather_code,
            precipitation: d.current.precipitation ?? 0,
            windSpeed: Math.round(d.current.wind_speed_10m),
          }))
          .catch(() => null)
      )
    );
    return results.filter((r): r is WeatherCity => r !== null);
  } catch {
    return [];
  }
}

/** WMO weather code → human label + emoji */
export function describeWeather(code: number): { label: string; emoji: string; isAlert: boolean } {
  if (code === 0) return { label: "Clear", emoji: "☀️", isAlert: false };
  if (code <= 2) return { label: "Mostly Clear", emoji: "🌤️", isAlert: false };
  if (code === 3) return { label: "Overcast", emoji: "☁️", isAlert: false };
  if (code <= 48) return { label: "Foggy", emoji: "🌫️", isAlert: false };
  if (code <= 53) return { label: "Drizzle", emoji: "🌦️", isAlert: false };
  if (code <= 55) return { label: "Heavy Drizzle", emoji: "🌧️", isAlert: true };
  if (code <= 63) return { label: "Rain", emoji: "🌧️", isAlert: false };
  if (code <= 67) return { label: "Heavy Rain", emoji: "🌧️", isAlert: true };
  if (code <= 82) return { label: "Showers", emoji: "🌦️", isAlert: false };
  if (code <= 82) return { label: "Heavy Showers", emoji: "⛈️", isAlert: true };
  if (code === 95) return { label: "Thunderstorm", emoji: "⛈️", isAlert: true };
  if (code >= 96) return { label: "Severe Storm", emoji: "⛈️", isAlert: true };
  return { label: "Cloudy", emoji: "🌥️", isAlert: false };
}
