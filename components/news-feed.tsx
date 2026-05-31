"use client";

import { useState } from "react";
import {
  Newspaper,
  AlertTriangle,
  TrendingUp,
  Globe2,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { NewsItem, NewsCategory } from "@/lib/types";

const CATEGORY_CONFIG: Record<
  Exclude<NewsCategory, "all">,
  { icon: typeof Newspaper; color: string; borderColor: string; bgHover: string }
> = {
  accidents: {
    icon: AlertTriangle,
    color: "text-red-500",
    borderColor: "border-l-red-400",
    bgHover: "hover:bg-red-50/60 dark:hover:bg-red-950/50",
  },
  finance: {
    icon: TrendingUp,
    color: "text-emerald-500",
    borderColor: "border-l-emerald-400",
    bgHover: "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/50",
  },
  general: {
    icon: Globe2,
    color: "text-blue-500",
    borderColor: "border-l-blue-400",
    bgHover: "hover:bg-blue-50/60 dark:hover:bg-blue-950/50",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsFeed({ initialNews }: { initialNews: NewsItem[] }) {
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <span>Live News Feed</span>
          <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">
            {initialNews.length} stories
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {initialNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Unable to load news</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Data will appear on next refresh</p>
          </div>
        ) : (
        <>
        {/* News items */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          {initialNews.map((item) => {
            const config = CATEGORY_CONFIG[item.category];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className={`flex gap-3 rounded-xl border border-l-[3px] ${config.borderColor} p-3 transition-all ${config.bgHover} cursor-pointer group`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="mt-0.5 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      item.category === "accidents"
                        ? "bg-red-100 dark:bg-red-900/40"
                        : item.category === "finance"
                          ? "bg-emerald-100 dark:bg-emerald-900/40"
                          : "bg-blue-100 dark:bg-blue-900/40"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 rounded-full"
                    >
                      {item.source}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(item.publishedAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {/* News detail dialog */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          {selectedItem && (() => {
            const config = CATEGORY_CONFIG[selectedItem.category];
            const Icon = config.icon;
            return (
              <DialogContent className="max-w-lg">
                {selectedItem.imageUrl && (
                  <img
                    src={selectedItem.imageUrl}
                    alt=""
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        selectedItem.category === "accidents"
                          ? "bg-red-100 dark:bg-red-900/40"
                          : selectedItem.category === "finance"
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-blue-100 dark:bg-blue-900/40"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {selectedItem.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(selectedItem.publishedAt)}
                    </span>
                  </div>
                  <DialogTitle className="text-base leading-snug">
                    {selectedItem.title}
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="sr-only">
                  Full news article details
                </DialogDescription>
                <div className="space-y-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {selectedItem.summary}
                  </p>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {selectedItem.source}
                    </span>
                    {selectedItem.url && (
                      <a
                        href={selectedItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Read full article
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </DialogContent>
            );
          })()}
        </Dialog>
      </CardContent>
    </Card>
  );
}
