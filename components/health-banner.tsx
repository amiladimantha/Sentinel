import { HeartPulse, ExternalLink } from "lucide-react";
import { getHealthAlerts } from "@/lib/api/health-alerts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function HealthBanner() {
  const alerts = await getHealthAlerts();
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/60 dark:bg-green-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600">
          <HeartPulse className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold">Health &amp; Epidemiology Updates</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">Epidemiology Unit · MOH</span>
      </div>
      <ul className="space-y-1.5">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
            <div className="min-w-0 flex-1">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:text-green-700 dark:hover:text-green-300 hover:underline line-clamp-1 flex items-center gap-1"
              >
                {a.title}
                <ExternalLink className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
              </a>
              <span className="text-[10px] text-muted-foreground">{formatDate(a.publishedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
