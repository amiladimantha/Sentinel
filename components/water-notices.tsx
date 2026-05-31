import { Droplets, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWaterNotices } from "@/lib/api/water-notices";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function WaterNotices() {
  const notices = await getWaterNotices();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span>Water Supply Notices</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">NWSDB</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Droplets className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No recent notices</p>
            <a
              href="https://www.waterboard.lk"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              Visit NWSDB <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <ul className="space-y-2">
            {notices.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 px-3 py-2.5 hover:bg-blue-100/80 dark:hover:bg-blue-950/40 transition-colors group"
                >
                  <Droplets className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {n.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(n.publishedAt)}
                    </p>
                  </div>
                </a>
              </li>
            ))}
            <li className="pt-0.5">
              <a
                href="https://www.waterboard.lk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all on waterboard.lk <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
