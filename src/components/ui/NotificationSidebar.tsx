"use client";
import type { ChatNotification } from "@/lib/useChatNotifications";
interface SP { open: boolean; onClose: () => void; notifications: ChatNotification[]; onNotificationClick: (n: ChatNotification) => void; onClearAll: () => void; unreadCount: number; }
export default function NotificationSidebar({ open, onClose, notifications, onNotificationClick, onClearAll, unreadCount }: SP) {
  const grp = notifications.reduce<Record<string, ChatNotification[]>>((a, n) => { if (!a[n.chatId]) a[n.chatId] = []; a[n.chatId].push(n); return a; }, {});
  const sorted = Object.values(grp).sort((a, b) => b[b.length - 1].timestamp - a[a.length - 1].timestamp);
  const fmt = (ts: number) => { const m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`; return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  return (<>
    <div className={`fixed inset-0 bg-black/20 z-[70] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
    <div className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white border-l border-[#e2e8f0] z-[80] transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"} flex flex-col shadow-2xl`}>
      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3"><div className="w-9 h-9 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div><div><h2 className="text-[#1e293b] font-bold text-lg font-[Outfit]">Notifications</h2>{unreadCount > 0 && <p className="text-[#8b5cf6] text-xs">{unreadCount} unread</p>}</div></div>
        <div className="flex items-center gap-2">{notifications.length > 0 && <button onClick={onClearAll} className="text-[#94a3b8] hover:text-[#1e293b] text-xs px-2 py-1 hover:bg-[#f1f5f9] rounded-lg transition-colors">Clear all</button>}<button onClick={onClose} className="text-[#94a3b8] hover:text-[#1e293b] p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? <div className="flex flex-col items-center justify-center h-full px-8 text-center"><div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mb-4"><svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div><p className="text-[#475569] font-medium mb-1">No notifications</p><p className="text-[#94a3b8] text-sm">New messages appear here</p></div> : (
          <div>{sorted.map((ns) => { const l = ns[ns.length - 1]; const ur = ns.some((n) => !n.read); return (
            <button key={l.chatId} onClick={() => onNotificationClick(l)} className={`w-full text-left px-5 py-4 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] ${ur ? "bg-[#8b5cf6]/[0.03]" : ""}`}>
              <div className="flex items-start gap-3"><div className="relative flex-shrink-0"><div className="w-11 h-11 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">{l.senderName?.charAt(0)?.toUpperCase()}</span></div>{ur && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-white" />}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-0.5"><p className={`text-sm font-semibold truncate ${ur ? "text-[#1e293b]" : "text-[#475569]"}`}>{l.senderName}</p><span className="text-xs text-[#94a3b8] ml-2">{fmt(l.timestamp)}</span></div><p className={`text-sm truncate ${ur ? "text-[#475569]" : "text-[#94a3b8]"}`}>{l.content}</p>{ns.length > 1 && <p className="text-xs text-[#8b5cf6] mt-1">{ns.length} messages</p>}</div>
                {ur && <div className="flex-shrink-0 mt-2"><div className="w-2.5 h-2.5 bg-[#8b5cf6] rounded-full" /></div>}
              </div>
            </button>); })}</div>
        )}
      </div>
    </div>
  </>);
}
export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (<button onClick={onClick} className="relative p-2.5 hover:bg-[#f1f5f9] rounded-xl transition-colors group" title="Notifications">
    <svg className={`w-5 h-5 transition-colors ${count > 0 ? "text-[#8b5cf6]" : "text-[#94a3b8] group-hover:text-[#1e293b]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">{count > 99 ? "99+" : count}</span>}
  </button>);
}