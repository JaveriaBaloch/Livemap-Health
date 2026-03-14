"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  senderName: string;
  content: string;
  timestamp: number;
}

interface ChatNotificationBannerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onTap?: (notification: Notification) => void;
}

export default function ChatNotificationBanner({ notifications = [], onDismiss, onTap }: ChatNotificationBannerProps) {
  // Only show the latest notification (auto-dismiss older)
  const latest = notifications?.[notifications.length - 1];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latest) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(latest.id), 300); // wait for animation
    }, 5000);
    return () => clearTimeout(timer);
  }, [latest, onDismiss]);

  if (!latest || !visible) return null;

  return (
    <div
      className={`fixed top-4 right-4 left-4 md:left-auto md:w-[400px] z-[80] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div
        className="bg-gray-800 border border-purple-500/60 rounded-xl p-4 shadow-2xl shadow-purple-500/20 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => onTap?.(latest)}
      >
        <div className="flex items-start gap-3">
          {/* Pulsing icon */}
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 relative">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-semibold text-sm truncate">{latest.senderName}</p>
              <span className="text-purple-400 text-xs">just now</span>
            </div>
            <p className="text-gray-300 text-sm truncate">{latest.content}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              setTimeout(() => onDismiss(latest.id), 300);
            }}
            className="text-gray-500 hover:text-white p-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tap hint */}
        {onTap && (
          <p className="text-purple-400 text-xs mt-2 text-center">Tap to open chat</p>
        )}
      </div>
    </div>
  );
}

/** Small badge component for navbars */
export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-gray-800 animate-bounce">
      {count > 99 ? "99+" : count}
    </span>
  );
}