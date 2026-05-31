import { ExternalLink, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import type { LoadSheddingStatus } from "@/lib/types";

export function LoadSheddingWidget({ status }: { status: LoadSheddingStatus }) {
  return (
    <div className="space-y-4">
      {/* Status banner */}
      {status.isActive && status.announcementTitle ? (
        <a
          href={status.announcementUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-3 py-2.5 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700 dark:text-red-300 line-clamp-2">
              {status.announcementTitle}
            </p>
            <p className="text-[10px] text-red-500/80 mt-0.5">
              From CEB — tap to read full announcement
            </p>
          </div>
          <ExternalLink className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
        </a>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            No load shedding announced — power supply is normal.
          </p>
        </div>
      )}

      {/* What to do when active */}
      <div className="rounded-lg border bg-muted/20 px-3 py-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">
          {status.isActive ? "Load shedding is active" : "If load shedding is activated"}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          CEB publishes zone-wise cut times on their website when load shedding is in effect.
          Use the links below to find your zone letter and check your scheduled times.
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          <a
            href="https://cebcare.ceb.lk/Incognito/OutageMap"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            Find your zone on the CEB Outage Map
          </a>
          <a
            href="https://ceb.lk/load-shedding/en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            Load shedding schedule — ceb.lk
          </a>
        </div>
      </div>

      {/* Live outage map button */}
      <a
        href="https://cebcare.ceb.lk/Incognito/OutageMap"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/60 transition-colors px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View Live Outage Map — cebcare.ceb.lk
      </a>
    </div>
  );
}
