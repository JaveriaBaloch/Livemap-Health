"use client";
import type { DBNotification } from "@/lib/useNotifications";

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: DBNotification[];
  unreadCount: number;
  onNotificationClick: (n: DBNotification) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationSidebar({
  open, onClose, notifications, unreadCount,
  onNotificationClick, onMarkRead, onMarkAllRead,
}: Props) {
  const fmt = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  const unread = notifications.filter((n) => !n.read);
  const readNotifs = notifications.filter((n) => n.read);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-[70] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-[#e2e8f0] z-[80] transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"} flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-[#1e293b] font-bold text-lg font-[Outfit]">Notifications</h2>
              {unreadCount > 0 && <p className="text-[#ef4444] text-xs font-semibold">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} className="text-[#3b82f6] hover:text-[#2563eb] text-xs px-2.5 py-1.5 hover:bg-[#3b82f6]/5 rounded-lg transition-colors font-medium">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-[#94a3b8] hover:text-[#1e293b] p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-[#475569] font-medium mb-1">No notifications</p>
              <p className="text-[#94a3b8] text-sm">Status updates appear here</p>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <div>
                  <div className="px-5 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <p className="text-xs font-semibold text-[#ef4444] uppercase tracking-wider">
                      Unread ({unread.length})
                    </p>
                  </div>
                  {unread.map((n) => (
                    <NotifItem key={n.id} n={n} fmt={fmt} onClick={() => { onMarkRead(n.id); onNotificationClick(n); }} />
                  ))}
                </div>
              )}

              {/* Read section */}
              {readNotifs.length > 0 && (
                <div>
                  <div className="px-5 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Earlier
                    </p>
                  </div>
                  {readNotifs.map((n) => (
                    <NotifItem key={n.id} n={n} fmt={fmt} onClick={() => onNotificationClick(n)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ================================================================
   NOTIFICATION ITEM
   ================================================================ */
function NotifItem({ n, fmt, onClick }: { n: DBNotification; fmt: (d: string) => string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] ${!n.read ? "bg-white" : "bg-[#fafafa]"}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
            style={{ background: `${n.color}12` }}
          >
            {n.icon}
          </div>
          {/* Unread dot */}
          {!n.read && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: n.color }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-sm font-semibold truncate ${!n.read ? "text-[#1e293b]" : "text-[#94a3b8]"}`}>
              {n.title}
            </p>
            <span className="text-[10px] text-[#94a3b8] ml-2 flex-shrink-0">{fmt(n.createdAt)}</span>
          </div>
          <p className={`text-sm ${!n.read ? "text-[#475569]" : "text-[#94a3b8]"}`}>
            {n.message}
          </p>
          {/* Type tag */}
          <span
            className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${n.color}10`, color: n.color }}
          >
            {n.type === "chat" ? "Message" : n.status || "Update"}
          </span>
        </div>

        {/* Unread indicator */}
        {!n.read && (
          <div className="flex-shrink-0 mt-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: n.color }} />
          </div>
        )}
      </div>
    </button>
  );
}

/* ================================================================
   NOTIFICATION BELL
   ================================================================ */
export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative p-2.5 hover:bg-[#f1f5f9] rounded-xl transition-colors group" title="Notifications">
      <svg
        className={`w-5 h-5 transition-colors ${count > 0 ? "text-[#8b5cf6]" : "text-[#94a3b8] group-hover:text-[#1e293b]"}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}