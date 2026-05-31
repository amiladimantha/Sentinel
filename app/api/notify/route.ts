import { NextResponse } from "next/server";
import webpush from "web-push";
import fs from "fs/promises";
import path from "path";

const SUBS_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@islandwatch.lk",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

async function readSubscriptions(): Promise<PushSubscriptionJSON[]> {
  try {
    const data = await fs.readFile(SUBS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs: PushSubscriptionJSON[]) {
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(request: Request) {
  try {
    const { title, body, tag, url } = await request.json();

    const subs = await readSubscriptions();
    if (subs.length === 0) {
      return NextResponse.json({ error: "No subscribers" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || "Sentinel",
      body: body || "New update available",
      tag: tag || "iw-general",
      url: url || "/",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(sub as webpush.PushSubscription, payload)
      )
    );

    // Remove expired/invalid subscriptions
    const validSubs = subs.filter((_, i) => {
      const result = results[i];
      if (result.status === "rejected") {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        return statusCode !== 404 && statusCode !== 410;
      }
      return true;
    });

    if (validSubs.length < subs.length) {
      await writeSubscriptions(validSubs);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: subs.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send", detail: String(err) },
      { status: 500 }
    );
  }
}
