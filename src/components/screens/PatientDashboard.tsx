"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";
import type { DBNotification } from "@/lib/useNotifications";
import EmergencyChat from "@/components/ui/EmergencyChat";
import NotificationSidebar, { NotificationBell } from "@/components/ui/NotificationSidebar";
import AIChatbot from "@/components/ui/AIChatbot";
import type { ActiveScreen, EmergencyData, AcceptedDoctor } from "@/types";

interface Props {
  onNavigate: (s: ActiveScreen) => void;
  onOpenProfile: () => void;
  onTrackDoctor: (s: EmergencyData, d: AcceptedDoctor) => void;
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  accepted:      { label: "Accepted",    color: "#10b981", icon: "✅" },
  "en-route":    { label: "En Route",    color: "#f59e0b", icon: "🚗" },
  arrived:       { label: "Arrived",     color: "#3b82f6", icon: "📍" },
  "in-progress": { label: "In Progress", color: "#8b5cf6", icon: "🩺" },
  resolved:      { label: "Resolved",    color: "#8b5cf6", icon: "🏁" },
};

export default function PatientDashboard({ onNavigate, onOpenProfile, onTrackDoctor }: Props) {
  const { user } = useAppStore();
  const [sos, setSos] = useState<any[]>([]);
  const [sidebar, setSidebar] = useState(false);
  const [chat, setChat] = useState<{ emergencyId: string; doctorId: string; doctorName: string } | null>(null);

  // DB-backed notifications
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    userId: user?._id,
    enabled: !!user?._id,
    interval: 5000,
  });

  // Fetch SOS
  const fetchSOS = useCallback(async () => {
    if (!user?._id || user.role === "doctor") return;
    try {
      const r = await fetch(`/api/patient/accepted-sos?patientId=${user._id}`);
      if (r.ok) setSos((await r.json()).emergencies || []);
    } catch {}
  }, [user]);

  useEffect(() => { fetchSOS(); const i = setInterval(fetchSOS, 10000); return () => clearInterval(i); }, [fetchSOS]);

  if (!user) return null;

  // Get latest status per emergency from notifications
  const getLatestStatus = (emId: string) => {
    const statusNotifs = notifications.filter((n) => n.type === "status" && n.emergencyId === emId);
    return statusNotifs.length > 0 ? statusNotifs[0].status : null;
  };

  const handleNotificationClick = (n: DBNotification) => {
    setSidebar(false);
    
    // Chat notification → open chat popup
    if (n.type === "chat" && n.fromUserId && n.emergencyId) {
      setChat({
        emergencyId: n.emergencyId,
        doctorId: n.fromUserId,
        doctorName: n.fromUserName || n.title || "Doctor",
      });
      return;
    }
    
    // Status notification → open tracking
    if (n.emergencyId) {
      const match = sos.find((s) => (s.id || s._id) === n.emergencyId);
      if (match) track(match);
    }
  };

  const track = (s: any) =>
    onTrackDoctor(
      { id: s.id || s._id, patientId: s.patientId || user._id, patientName: s.patientName || user.name, description: s.description, latitude: s.latitude, longitude: s.longitude, estimatedArrival: s.estimatedArrival, acceptedAt: s.acceptedAt },
      { doctorId: s.doctor?.id || s.doctor?._id, doctorName: s.doctor?.name, specialization: s.doctor?.specialization, phone: s.doctor?.phone, location: s.doctor?.location, status: "accepted", estimatedArrival: s.estimatedArrival || "5-10 min" }
    );

  const openDoctorChat = (s: any) => {
    const did = s.doctor?.id || s.doctor?._id;
    const eid = s.id || s._id;
    if (!eid || !did) { alert("Not available yet."); return; }
    setChat({ emergencyId: String(eid), doctorId: String(did), doctorName: s.doctor?.name || "Doctor" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] relative">
      {/* Notification Sidebar */}
      <NotificationSidebar
        open={sidebar}
        onClose={() => setSidebar(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {/* AI Chatbot */}
      <AIChatbot
        onNavigateSOS={() => onNavigate("emergency-sos")}
        onNavigateDoctors={() => onNavigate("specialist-search")}
        onNavigatePharmacy={() => onNavigate("pharmacy-search")}
      />

      {/* Navbar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-xl flex items-center justify-center">
              <svg className="text-white w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="font-bold text-lg font-[Outfit] tracking-tight">LiveMap <span className="text-[#3b82f6]">Health</span></h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell count={unreadCount} onClick={() => setSidebar(true)} />
            <button onClick={onOpenProfile} className="flex items-center gap-2 hover:bg-[#f1f5f9] px-2.5 py-2 rounded-xl transition-colors">
              <span className="text-sm text-[#475569] hidden sm:block">{user.name}</span>
              <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">{user.name?.charAt(0).toUpperCase()}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="font-bold text-3xl md:text-4xl font-[Outfit] mb-3 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">LiveMap Health</span>
          </h2>
          <p className="text-[#475569] text-lg max-w-xl mx-auto">Find medical help, emergency services, and healthcare providers</p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { s: "specialist-search" as ActiveScreen, c: "#3b82f6", t: "Find Specialists", d: "Medical specialists & doctors", i: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
            { s: "pharmacy-search" as ActiveScreen, c: "#10b981", t: "Find Pharmacies", d: "Nearby pharmacies & stores", i: "M19 14l-7 7m0 0l-7-7m7 7V3" },
            { s: "emergency-sos" as ActiveScreen, c: "#ef4444", t: "Emergency SOS", d: "Get immediate medical help", i: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" },
          ].map(({ s, c, t, d, i }) => (
            <button key={s} onClick={() => onNavigate(s)} className="group relative overflow-hidden rounded-2xl p-7 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-[#e2e8f0] bg-white">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, ${c}08, ${c}04)` }} />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${c}12` }}>
                  <svg className="w-5 h-5" style={{ color: c }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={i} /></svg>
                </div>
                <h3 className="font-bold text-lg text-[#1e293b] font-[Outfit] mb-1">{t}</h3>
                <p className="text-[#475569] text-sm">{d}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Accepted SOS */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-lg text-[#10b981] font-[Outfit]">Accepted SOS ({sos.length})</h3>
              {unreadCount > 0 && (
                <span className="bg-[#ef4444]/10 text-[#ef4444] text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <button onClick={fetchSOS} className="text-[#94a3b8] hover:text-[#1e293b] text-sm px-3 py-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors">Refresh</button>
          </div>

          {sos.length === 0 ? (
            <p className="text-[#94a3b8] text-sm py-4">No accepted SOS requests yet.</p>
          ) : (
            <div className="space-y-3">
              {sos.map((s: any) => {
                const emId = s.id || s._id;
                const liveStatus = getLatestStatus(emId) || s.status || "accepted";
                const meta = STATUS_META[liveStatus] || STATUS_META.accepted;

                return (
                  <div key={emId} className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#cbd5e1] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-[#1e293b] font-semibold">Dr. {s.doctor?.name || "Doctor"}</p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm" style={{ background: meta.color }}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>
                        <p className="text-[#475569] text-sm">{s.doctor?.specialization || "General Practice"}</p>
                        <p className="text-[#94a3b8] text-xs mt-1">ETA: {s.estimatedArrival || "5-10 min"}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[130px]">
                        <button onClick={() => track(s)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">📍 Track</button>
                        <button onClick={() => openDoctorChat(s)} className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">💬 Chat</button>
                        {s.doctor?.phone && <button onClick={() => window.open(`tel:${s.doctor.phone}`, "_self")} className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">📞 Call</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat popup */}
      {chat && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setChat(null)} />
          <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[420px] z-[65] animate-slide-up">
            <div className="bg-white rounded-2xl border border-[#8b5cf6]/20 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">{chat.doctorName?.charAt(0)?.toUpperCase()}</span></div>
                  <div><p className="text-white font-semibold text-sm">Dr. {chat.doctorName}</p><p className="text-white/70 text-xs">Emergency Chat</p></div>
                </div>
                <button onClick={() => setChat(null)} className="text-white/70 hover:text-white p-1 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-3"><EmergencyChat emergencyId={chat.emergencyId} otherUserId={chat.doctorId} otherUserName={chat.doctorName} onClose={() => setChat(null)} title="" /></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}