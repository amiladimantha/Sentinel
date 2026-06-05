export interface FuelPrice {
  fuelType: "Petrol 92" | "Petrol 95" | "Auto Diesel" | "Super Diesel";
  provider: "Ceypetco";
  price: number;
  previousPrice: number;
  unit: "LKR/L";
  lastUpdated: string;
  history: { date: string; price: number }[];
}

export interface WeatherCity {
  city: string;
  temp: number;
  humidity: number;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
}

export interface CricketMatch {
  title: string;
  url: string;
  isLive: boolean;
}

export interface RecentCricketMatch {
  matchId: number;
  slug: string;
  seriesName: string;
  matchDesc: string;
  format: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  opponent: string;
  opponentShort: string;
  venue: string;
  city: string;
  statusText: string;
  outcome: "won" | "lost" | "draw" | "no-result" | "completed";
  sriLankaScore: string;
  sriLankaScoreInfo: string;
  opponentScore: string;
  opponentScoreInfo: string;
}

export interface FDRate {
  bank: string;
  shortName: string;
  rates: {
    "3m": number | null;
    "6m": number | null;
    "12m": number | null;
    "24m": number | null;
  };
}

export interface FDRateData {
  banks: FDRate[];
  lastVerified: string;
  source: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  category: "accidents" | "finance" | "general";
  source: string;
  url: string;
  publishedAt: string;
}

export interface ElectricityTariff {
  category: string;
  units: string;
  rate: number;
  previousRate: number;
  effectiveDate: string;
  fixedCharge?: number; // monthly service charge added when entering this consumption band
  scheme?: "low" | "mid" | "high"; // which consumption scheme this block belongs to
}

export interface ElectricityHikeHistory {
  month: string;
  rate: number;
}

export interface ExchangeRate {
  currency: string;
  code: "USD" | "GBP" | "EUR" | "INR" | "AUD" | "SAR" | "JPY" | "CAD";
  buyingRate: number;
  sellingRate: number;
  previousBuyingRate: number;
  previousSellingRate: number;
  lastUpdated: string;
  history: { date: string; buying: number; selling: number }[];
}

export interface DisasterAlert {
  id: string;
  type: "flood" | "landslide" | "cyclone" | "tsunami" | "drought" | "heavy-rain";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affectedAreas: string[];
  issuedAt: string;
  expiresAt: string;
  source: string;
}

export interface TrafficNotice {
  id: string;
  title: string;
  description?: string;
  url: string;
  source: "RDA";
  publishedAt?: string;
}

export interface WaterNotice {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: "NWSDB";
}

export interface HealthAlert {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: "Epidemiology Unit";
}

export interface PublicHoliday {
  name: string;
  date: string; // YYYY-MM-DD
  daysUntil: number;
}

export interface LoadSheddingStatus {
  isActive: boolean;
  announcementTitle: string | null;
  announcementUrl: string | null;
  detectedAt: string | null;
  source: "CEB";
}

export interface LPGPrice {
  size: "12.5kg" | "5kg";
  displayName: string;
  price: number;
  previousPrice: number;
  unit: "LKR/cylinder";
  lastUpdated: string;
  history: { date: string; price: number }[];
}

export interface DistrictRisk {
  district: string;
  level: "none" | "low" | "moderate" | "high" | "critical";
  reason: string;
}

export type Locale = "en";

export type NewsCategory = "all" | "accidents" | "finance" | "general";
