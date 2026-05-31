import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoadSheddingStatus } from "@/lib/api/load-shedding";
import { LoadSheddingWidget } from "@/components/load-shedding-widget";

export async function LoadShedding() {
  const status = await getLoadSheddingStatus();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span>Load Shedding</span>
          <div className="ml-auto">
            {status.isActive ? (
              <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-300/30 text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300/30 text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Normal
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LoadSheddingWidget status={status} />
      </CardContent>
    </Card>
  );
}
