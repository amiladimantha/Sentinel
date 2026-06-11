import { NextResponse } from "next/server";
import webpush from "web-push";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/api/runtime-json";

const SUBS_FILE = "push-subscriptions.json";
const NOTIFICATION_BATCH_SIZE = 100;

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys are not set. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables."
    );
  }
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@sentinel.lk",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
}

async function readSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const subs = await readRuntimeJson<PushSubscriptionJSON[]>(SUBS_FILE);
  return Array.isArray(subs) ? subs : [];
}

async function writeSubscriptions(subs: PushSubscriptionJSON[]) {
  await writeRuntimeJson(SUBS_FILE, subs);
}

export async function POST(request: Request) {
  try {
    ensureVapid();

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

    const results: PromiseSettledResult<unknown>[] = [];
    for (let i = 0; i < subs.length; i += NOTIFICATION_BATCH_SIZE) {
      const batch = subs.slice(i, i + NOTIFICATION_BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((sub) =>
          webpush.sendNotification(sub as webpush.PushSubscription, payload)
        )
      );
      results.push(...batchResults);
    }

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
