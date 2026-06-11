import { NextResponse } from "next/server";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/api/runtime-json";

const SUBS_FILE = "push-subscriptions.json";

async function readSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const subs = await readRuntimeJson<PushSubscriptionJSON[]>(SUBS_FILE);
  return Array.isArray(subs) ? subs : [];
}

async function writeSubscriptions(subs: PushSubscriptionJSON[]) {
  await writeRuntimeJson(SUBS_FILE, subs);
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const subs = await readSubscriptions();

    // Avoid duplicates
    const endpoints = new Set(subs.map((s) => s.endpoint));
    if (!endpoints.has(subscription.endpoint)) {
      subs.push(subscription);
      await writeSubscriptions(subs);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const subs = await readSubscriptions();
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    await writeSubscriptions(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
