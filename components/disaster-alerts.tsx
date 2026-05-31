import { AlertTriangle, CloudRain, MapPin, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getDisasterAlerts } from "@/lib/api/disaster-alerts";

const SEVERITY_STYLES: Record<
  string,
  { wrapper: string; badge: string }
> = {
  critical: {
    wrapper:
      "border-red-500 bg-gradient-to-r from-red-50 to-red-100/50 text-red-900 dark:from-red-950 dark:to-red-900/50 dark:text-red-100",
    badge: "bg-red-500 text-white border-red-500",
  },
  high: {
    wrapper:
      "border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50/50 text-orange-900 dark:from-orange-950 dark:to-amber-950/50 dark:text-orange-100",
    badge: "bg-orange-500 text-white border-orange-500",
  },
  medium: {
    wrapper:
      "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50/50 text-yellow-900 dark:from-yellow-950 dark:to-amber-950/50 dark:text-yellow-100",
    badge: "bg-yellow-500 text-white border-yellow-500",
  },
  low: {
    wrapper:
      "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50/50 text-blue-900 dark:from-blue-950 dark:to-sky-950/50 dark:text-blue-100",
    badge: "bg-blue-500 text-white border-blue-500",
  },
};

const TYPE_ICONS: Record<string, typeof CloudRain> = {
  "heavy-rain": CloudRain,
  flood: CloudRain,
  landslide: AlertTriangle,
  cyclone: CloudRain,
  tsunami: AlertTriangle,
  drought: AlertTriangle,
};

export async function DisasterAlerts() {
  const alerts = await getDisasterAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const severity = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;
        const Icon = TYPE_ICONS[alert.type] ?? AlertTriangle;

        return (
          <Alert
            key={alert.id}
            className={`${severity.wrapper} rounded-xl border-l-4 shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <AlertTitle className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </span>
                  {alert.title}
                  <Badge
                    className={`${severity.badge} text-[10px] uppercase px-2 py-0 font-bold rounded-full`}
                  >
                    {alert.severity}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed opacity-90">
                  {alert.description}
                </AlertDescription>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                  <div className="flex items-center gap-1 text-[11px] font-medium">
                    <MapPin className="h-3 w-3" />
                    {alert.affectedAreas.join(" · ")}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] opacity-60">
                    <Shield className="h-3 w-3" />
                    {alert.source} &middot;{" "}
                    {new Date(alert.issuedAt).toLocaleString("en-LK", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
