"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type PermState = "default" | "granted" | "denied" | "unsupported";

export function NotificationBell() {
  const [permission, setPermission] = useState<PermState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (active) setPermission("unsupported");
        return;
      }

      if (active) setPermission(Notification.permission as PermState);

      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (active) setIsSubscribed(!!sub);
        });
      });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Send subscription to our server
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setIsSubscribed(true);
      setPermission("granted");
    } catch (err) {
      if (Notification.permission === "denied") {
        setPermission("denied");
      }
      console.error("Push subscribe failed:", err);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
    setLoading(false);
  };

  if (permission === "unsupported") return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading || permission === "denied"}
      title={
        permission === "denied"
          ? "Notifications blocked — enable in browser settings"
          : isSubscribed
          ? "Disable notifications"
          : "Enable notifications"
      }
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        isSubscribed
          ? "bg-sky-100 border-sky-300 text-sky-600 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-400"
          : "bg-muted border-border text-muted-foreground hover:bg-accent"
      } ${loading ? "animate-pulse" : ""} ${
        permission === "denied" ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {permission === "denied" ? (
        <BellOff className="h-4 w-4" />
      ) : isSubscribed ? (
        <BellRing className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
    </button>
  );
}
