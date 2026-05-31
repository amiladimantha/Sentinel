import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SUBS_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");

async function readSubscriptions(): Promise<PushSubscriptionJSON[]> {
  try {
    const data = await fs.readFile(SUBS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs: PushSubscriptionJSON[]) {
  await fs.mkdir(path.dirname(SUBS_FILE), { recursive: true });
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const subs = await readSubscriptions();

    // Avoid duplicates
    const exists = subs.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
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
