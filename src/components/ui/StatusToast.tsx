"use client";

import { useEffect, useState } from "react";
import type { StatusNotification } from "@/lib/useEmergencyStatusNotifications";

interface Props {
  notifications: StatusNotification[];
  onDismiss: (id: string) => void;
}

export default function StatusToast({ notifications, onDismiss }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-md pointer-events-none">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ notification, onDismiss }: { notification: StatusNotification; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss after 6s
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 6000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto transition-all duration-300 ${
        visible && !exiting
          ? "opacity-100 translate-y-0"
          : exiting
          ? "opacity-0 -translate-y-2"
          : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className="bg-white rounded-2xl border shadow-xl p-4 flex items-start gap-3"
        style={{ borderColor: `${notification.color}30` }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: `${notification.color}15` }}
        >
          {notification.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1e293b]">{notification.message}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {notification.status === "en-route"
              ? "Stay at your location"
              : notification.status === "arrived"
              ? "Help is here"
              : notification.status === "resolved"
              ? "Thank you for using LiveMap"
              : "Emergency update"}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(() => onDismiss(notification.id), 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-[#f1f5f9] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Color accent line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
          style={{ background: notification.color }}
        />
      </div>
    </div>
  );
}