import { Car, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrafficNotices } from "@/lib/api/traffic";

export async function TrafficFeed() {
  const notices = await getTrafficNotices();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span>Road Notices</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">RDA</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Car className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No active road notices</p>
            <a
              href="https://rda.gov.lk/index.php?option=com_content&view=article&id=38&Itemid=132&lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              View RDA notices <ExternalLink className="h-3 w-3" />
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
                  className="flex items-start gap-2.5 rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/60 dark:bg-yellow-950/20 px-3 py-2.5 hover:bg-yellow-100/80 dark:hover:bg-yellow-950/40 transition-colors group"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-yellow-700 dark:group-hover:text-yellow-300">
                    {n.title}
                  </span>
                </a>
              </li>
            ))}
            <li className="pt-0.5">
              <a
                href="https://rda.gov.lk/index.php?option=com_content&view=article&id=38&Itemid=132&lang=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all notices on rda.gov.lk <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
