"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface DBNotification {
  id: string;
  type: "status" | "chat" | "system";
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  emergencyId?: string;
  chatId?: string;
  fromUserId?: string;
  fromUserName?: string;
  status?: string;
  createdAt: string;
}

export function useNotifications({
  userId,
  enabled = true,
  interval = 5000,
}: {
  userId: string | undefined;
  enabled?: boolean;
  interval?: number;
}) {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCount = useRef(0);

  // Sound
  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 660; o.type = "sine"; g.gain.value = 0.15;
      o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.stop(ctx.currentTime + 0.3);
      setTimeout(() => {
        try {
          const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(ctx.destination);
          o2.frequency.value = 880; o2.type = "sine"; g2.gain.value = 0.15;
          o2.start(); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o2.stop(ctx.currentTime + 0.3);
        } catch {}
      }, 200);
    } catch {}
  }, []);

  // Fetch from DB
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
      if (!r.ok) return;
      const data = await r.json();
      setNotifications(data.notifications || []);
      const newUnread = data.unreadCount || 0;

      // Play sound if unread count increased
      if (newUnread > prevCount.current && prevCount.current >= 0) {
        beep();
      }
      prevCount.current = newUnread;
      setUnreadCount(newUnread);
    } catch {}
  }, [userId, beep]);

  useEffect(() => {
    if (!enabled || !userId) return;
    fetchNotifications();
    const t = setInterval(fetchNotifications, interval);
    return () => clearInterval(t);
  }, [enabled, userId, interval, fetchNotifications]);

  // Mark single notification read
  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch {}
  }, []);

  // Mark all read
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    prevCount.current = 0;
    if (!userId) return;
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, markAllRead: true }),
      });
    } catch {}
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}