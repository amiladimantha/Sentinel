"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Wind, Droplets, AlertTriangle, MapPin, Search, X, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describeWeather } from "@/lib/api/weather";
import type { WeatherCity } from "@/lib/types";

const DEFAULT_CITIES = ["Colombo", "Kandy", "Galle", "Jaffna"];
const STORAGE_KEY = "iw-weather-custom";

interface SavedCity {
  name: string;
  lat: number;
  lon: number;
  admin?: string; // district/province for disambiguation
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
}

interface WeatherWidgetProps {
  defaultCities: WeatherCity[];
}

export function WeatherWidget({ defaultCities }: WeatherWidgetProps) {
  const [customCities, setCustomCities] = useState<SavedCity[]>([]);
  const [customWeather, setCustomWeather] = useState<WeatherCity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved custom cities from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCustomCities(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save custom cities
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customCities));
    } catch {
      // ignore
    }
  }, [customCities]);

  // Fetch weather for custom cities
  const fetchCustomWeather = useCallback(async (cities: SavedCity[]) => {
    if (cities.length === 0) {
      setCustomWeather([]);
      return;
    }
    const controller = new AbortController();
    const params =
      "current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m&timezone=Asia%2FColombo";
    const results = await Promise.all(
      cities.map(({ name, lat, lon }) =>
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${params}`,
          { signal: controller.signal }
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
    setCustomWeather(results.filter((r): r is WeatherCity => r !== null));
    return controller;
  }, []);

  useEffect(() => {
    let controller: AbortController | undefined;
    fetchCustomWeather(customCities).then((c) => { controller = c; });
    return () => { controller?.abort(); };
  }, [customCities, fetchCustomWeather]);

  // Debounced geocoding search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&country_code=LK&language=en`
        );
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
      searchTimeout.current = null;
    }, 300);
  };

  const addCity = (result: GeoResult) => {
    const alreadyExists =
      customCities.some((c) => c.name === result.name) ||
      defaultCities.some((c) => c.city === result.name);
    if (alreadyExists) return;
    if (customCities.length >= 6) return; // max 6 custom

    setCustomCities((prev) => [
      ...prev,
      {
        name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        admin: result.admin2 ?? result.admin1,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeCity = (name: string) => {
    setCustomCities((prev) => prev.filter((c) => c.name !== name));
  };

  const allDisplayed = [...defaultCities, ...customWeather];

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500">
            <span className="text-base">🌤️</span>
          </div>
          <span>Weather</span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add city
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Search input */}
        {showSearch && (
          <div className="relative space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search any town in Sri Lanka..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                autoFocus
              />
              {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full rounded-lg border bg-card shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={`${r.name}-${r.latitude}-${i}`}
                    onClick={() => addCity(r)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{r.name}</span>
                    {(r.admin2 || r.admin1) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {r.admin2 ?? r.admin1}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-xs text-muted-foreground px-1">No results found</p>
            )}
          </div>
        )}

        {/* Custom city chips */}
        {customCities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customCities.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-900/40 px-2.5 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300"
              >
                {c.name}
                <button
                  onClick={() => removeCity(c.name)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Weather cards */}
        {allDisplayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Unable to load weather data</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {allDisplayed.map((city) => {
              const { label, emoji, isAlert } = describeWeather(city.weatherCode);
              const isCustom = customCities.some((c) => c.name === city.city);
              return (
                <div
                  key={city.city}
                  className={`relative rounded-xl border p-3 space-y-1.5 transition-colors ${
                    isAlert
                      ? "border-orange-300 dark:border-orange-800/60 bg-orange-50/60 dark:bg-orange-950/20"
                      : "border-sky-200 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20"
                  }`}
                >
                  {isAlert && (
                    <AlertTriangle className="absolute top-2 right-2 h-3.5 w-3.5 text-orange-500" />
                  )}
                  {isCustom && !isAlert && (
                    <button
                      onClick={() => removeCity(city.city)}
                      className="absolute top-2 right-2 h-4 w-4 rounded-full bg-muted/60 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <X className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{city.city}</span>
                    <span className="text-xl leading-none">{emoji}</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold tabular-nums leading-none">{city.temp}</span>
                    <span className="text-sm text-muted-foreground mb-0.5">°C</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80">
                    <span className="flex items-center gap-0.5">
                      <Droplets className="h-3 w-3" />
                      {city.humidity}%
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Wind className="h-3 w-3" />
                      {city.windSpeed} km/h
                    </span>
                    {city.precipitation > 0 && (
                      <span className="flex items-center gap-0.5 text-blue-500">
                        🌧 {city.precipitation.toFixed(1)} mm
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Source: Open-Meteo · Updates every 30 min
        </p>
      </CardContent>
    </Card>
  );
}
