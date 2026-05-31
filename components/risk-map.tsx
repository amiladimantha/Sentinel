"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { DistrictRisk } from "@/lib/types";

interface GeoFeature {
  properties: { name: string; code: string };
  geometry: { type: string; coordinates: number[][][][] };
}

interface RiskMapProps {
  risks: DistrictRisk[];
  geoData: { features: GeoFeature[] };
}

// Sri Lanka bounds (from GeoJSON analysis)
const BOUNDS = {
  minLat: 5.85,
  maxLat: 9.9,
  minLon: 79.45,
  maxLon: 81.95,
};

const SVG_WIDTH = 300;
const SVG_HEIGHT = 480;
const PADDING = 10;

const RISK_FILL: Record<string, { light: string; dark: string }> = {
  none: { light: "#e2e8f0", dark: "#334155" },
  low: { light: "#bae6fd", dark: "#0c4a6e" },
  moderate: { light: "#fde047", dark: "#854d0e" },
  high: { light: "#fb923c", dark: "#9a3412" },
  critical: { light: "#ef4444", dark: "#991b1b" },
};

const RISK_LABELS: Record<string, string> = {
  none: "Clear",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

/** Convert lon/lat to SVG x/y using equirectangular projection */
function project(lon: number, lat: number): [number, number] {
  const x =
    PADDING +
    ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) *
      (SVG_WIDTH - 2 * PADDING);
  // Flip Y axis (lat increases upward, SVG y increases downward)
  const y =
    PADDING +
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) *
      (SVG_HEIGHT - 2 * PADDING);
  return [x, y];
}

/** Convert a ring of coordinates to SVG path data */
function ringToPath(ring: number[][]): string {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

/** Convert a MultiPolygon geometry to SVG path data */
function featureToPath(feature: GeoFeature): string {
  const paths: string[] = [];
  for (const polygon of feature.geometry.coordinates) {
    for (const ring of polygon) {
      paths.push(ringToPath(ring));
    }
  }
  return paths.join(" ");
}

export function RiskMap({ risks, geoData }: RiskMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);


  const riskMap = new Map(risks.map((r) => [r.district, r]));

  const hoveredRisk = hovered ? riskMap.get(hovered) : null;

  // Count districts at each level
  const counts = risks.reduce(
    (acc, r) => {
      acc[r.level] = (acc[r.level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const hasAnyRisk = risks.some((r) => r.level !== "none");

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span>Weather Risk Map</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* SVG Map */}
        <div
          className="relative mx-auto"
          style={{ maxWidth: SVG_WIDTH }}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto"
            onMouseLeave={() => {
              setHovered(null);
              setTooltip(null);
            }}
          >
            {geoData.features.map((feature) => {
              const name = feature.properties.name;
              const risk = riskMap.get(name);
              const level = risk?.level || "none";
              const isHovered = hovered === name;

              return (
                <path
                  key={name}
                  d={featureToPath(feature)}
                  className="transition-all duration-150"
                  fill={RISK_FILL[level][isDark ? "dark" : "light"]}
                  stroke={isHovered ? (isDark ? "#e2e8f0" : "#1e293b") : (isDark ? "#475569" : "#94a3b8")}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={hovered && !isHovered ? 0.6 : 1}
                  onMouseEnter={(e) => {
                    setHovered(name);
                    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {hovered && tooltip && (
            <div
              className="absolute pointer-events-none z-10 rounded-lg border bg-popover px-3 py-2 shadow-md text-xs"
              style={{
                left: tooltip.x + 10,
                top: tooltip.y - 40,
                transform: tooltip.x > SVG_WIDTH * 0.65 ? "translateX(-110%)" : undefined,
              }}
            >
              <p className="font-semibold">{hovered === "NuwaraEliya" ? "Nuwara Eliya" : hovered}</p>
              {hoveredRisk && hoveredRisk.level !== "none" ? (
                <>
                  <p className="text-muted-foreground">
                    Risk: <span className="font-medium capitalize">{hoveredRisk.level}</span>
                  </p>
                  <p className="text-muted-foreground">{hoveredRisk.reason}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No active warnings</p>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {(["none", "low", "moderate", "high", "critical"] as const).map((level) => (
            <div key={level} className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-sm border border-border"
                style={{ backgroundColor: RISK_FILL[level][isDark ? "dark" : "light"] }}
              />
              <span className="text-[10px] text-muted-foreground">{RISK_LABELS[level]}</span>
              {counts[level] ? (
                <span className="text-[10px] text-muted-foreground/60">({counts[level]})</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Summary */}
        {hasAnyRisk ? (
          <p className="text-[11px] text-center text-muted-foreground">
            {risks.filter((r) => r.level === "high" || r.level === "critical").length > 0
              ? `⚠️ ${risks.filter((r) => r.level === "high" || r.level === "critical").length} district(s) under high/critical weather risk`
              : `${risks.filter((r) => r.level !== "none").length} district(s) with active weather advisories`}
          </p>
        ) : (
          <p className="text-[11px] text-center text-muted-foreground">
            No active weather warnings across Sri Lanka
          </p>
        )}

        <p className="text-[10px] text-muted-foreground/50 text-center">
          Source: Department of Meteorology · Updates every 15 min
        </p>
      </CardContent>
    </Card>
  );
}
