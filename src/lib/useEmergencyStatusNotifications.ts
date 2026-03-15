"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface StatusNotification {
  id: string;
  status: string;
  message: string;
  timestamp: number;
  icon: string;
  color: string;
}

const STATUS_META: Record<string, { message: string; icon: string; color: string }> = {
  "accepted": { message: "A doctor has accepted your emergency!", icon: "✅", color: "#10b981" },
  "en-route": { message: "Your doctor is on the way!", icon: "🚗", color: "#f59e0b" },
  "arrived": { message: "Your doctor has arrived!", icon: "📍", color: "#3b82f6" },
  "in-progress": { message: "Treatment is in progress.", icon: "🩺", color: "#8b5cf6" },
  "resolved": { message: "Your emergency has been resolved.", icon: "🏁", color: "#8b5cf6" },
};

export function useEmergencyStatusNotifications({
  emergencyId,
  enabled = true,
  interval = 5000,
}: {
  emergencyId: string | null | undefined;
  enabled?: boolean;
  interval?: number;
}) {
  const [currentStatus, setCurrentStatus] = useState<string>("active");
  const [doctorName, setDoctorName] = useState<string>("");
  const [notifications, setNotifications] = useState<StatusNotification[]>([]);
  const lastStatus = useRef<string>("active");

  const beep = useCallback((freq: number = 660) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.value = 0.2;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  const doubleBeep = useCallback(() => {
    beep(660);
    setTimeout(() => beep(880), 200);
  }, [beep]);

  const poll = useCallback(async () => {
    if (!emergencyId) return;
    try {
      const r = await fetch(`/api/emergency/status/${emergencyId}`);
      if (!r.ok) return;
      const data = await r.json();
      const status = data.emergency?.status || "active";
      const docName = data.acceptedDoctor?.doctorName || data.acceptedDoctor?.name || "";

      if (docName) setDoctorName(docName);

      // Detect status change
      if (status !== lastStatus.current && lastStatus.current !== "active") {
        const meta = STATUS_META[status];
        if (meta) {
          const notif: StatusNotification = {
            id: `${status}-${Date.now()}`,
            status,
            message: docName
              ? meta.message.replace("Your doctor", `Dr. ${docName}`).replace("A doctor", `Dr. ${docName}`)
              : meta.message,
            timestamp: Date.now(),
            icon: meta.icon,
            color: meta.color,
          };
          setNotifications((prev) => [...prev.slice(-4), notif]);
          doubleBeep();
        }
      }

      lastStatus.current = status;
      setCurrentStatus(status);
    } catch {}
  }, [emergencyId, doubleBeep]);

  useEffect(() => {
    if (!enabled || !emergencyId) return;
    poll();
    const t = setInterval(poll, interval);
    return () => clearInterval(t);
  }, [enabled, emergencyId, interval, poll]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    currentStatus,
    doctorName,
    notifications,
    dismiss,
    dismissAll,
  };
}