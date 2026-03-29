"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";
import NotificationSidebar, { NotificationBell } from "@/components/ui/NotificationSidebar";
import type { EmergencyData } from "@/types";

interface Props {
  onAcceptEmergency: (e: EmergencyData) => void;
  onGetDirections: (e: EmergencyData) => void;
  onViewAccepted: (e: EmergencyData, openChat?: boolean) => void;
  onOpenProfile: () => void;
}

export default function DoctorDashboard({ onAcceptEmergency, onGetDirections, onViewAccepted, onOpenProfile }: Props) {
  const { user, currentLocation } = useAppStore();
  const [ems, setEms] = useState<EmergencyData[]>([]);
  const [acc, setAcc] = useState<EmergencyData[]>([]);
  const [resolved, setResolved] = useState<any[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  // Role helpers
  const isMedical = user?.role === "doctor" || user?.role === "nurse" || user?.role === "paramedic";
  const roleLabel = user?.role === "doctor" ? "Doctor" : user?.role === "nurse" ? "Nurse" : user?.role === "paramedic" ? "Paramedic" : "Medical Staff";
  const namePrefix = user?.role === "doctor" ? "Dr. " : "";

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    userId: user?._id,
    enabled: !!user?._id && isMedical,
    interval: 5000,
  });

  // Fetch nearby active emergencies
  const fetchE = useCallback(async () => {
    if (!user?._id || !isMedical || !currentLocation) return;
    try {
      const r = await fetch(`/api/doctor/emergencies?doctorId=${user._id}&lat=${currentLocation.lat}&lng=${currentLocation.lng}`);
      if (r.ok) setEms((await r.json()).emergencies || []);
    } catch {}
  }, [user, currentLocation, isMedical]);

  // Fetch accepted emergencies
  const fetchA = useCallback(async () => {
    if (!user?._id || !isMedical) return;
    try {
      const r = await fetch(`/api/doctor/accepted-emergencies?doctorId=${user._id}`);
      if (r.ok) setAcc((await r.json()).emergencies || []);
    } catch {}
  }, [user, isMedical]);

  // Fetch resolved emergencies
  const fetchR = useCallback(async () => {
    if (!user?._id || !isMedical) return;
    try {
      const r = await fetch(`/api/doctor/resolved-emergencies?doctorId=${user._id}`);
      if (r.ok) setResolved((await r.json()).emergencies || []);
    } catch {}
  }, [user, isMedical]);

  useEffect(() => {
    fetchE();
    fetchA();
    fetchR();
    const i = setInterval(fetchE, 10000);
    return () => clearInterval(i);
  }, [fetchE, fetchA, fetchR]);

  // Accept emergency
  const accept = async (id: string) => {
    if (!user?._id) return;
    try {
      const r = await fetch("/api/doctor/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: user._id, emergencyId: id, action: "accept", doctorLocation: currentLocation }),
      });
      const d = await r.json();
      if (r.ok) {
        // ems now includes all patient medical fields from the updated API
        const f = ems.find((e) => e.id === id);

        // Refetch accepted emergencies to get the fully populated version
        let fullEm: EmergencyData | null = null;
        try {
          const ar = await fetch(`/api/doctor/accepted-emergencies?doctorId=${user._id}`);
          if (ar.ok) {
            const accepted = (await ar.json()).emergencies || [];
            setAcc(accepted);
            fullEm = accepted.find((e: any) => e.id === id) || null;
          }
        } catch {}

        // Use refetched data > ems data > POST response fallback
        const em: EmergencyData = fullEm || f || {
          id,
          patientId: d.emergency?.patientId,
          patientName: d.emergency?.patientName || "Unknown",
          latitude: d.emergency?.latitude,
          longitude: d.emergency?.longitude,
          description: d.emergency?.description,
          bloodGroup: d.emergency?.bloodGroup,
          allergies: d.emergency?.allergies || [],
          medicalConditions: d.emergency?.medicalConditions || [],
          phoneNumber: d.emergency?.phoneNumber,
          age: d.emergency?.age,
        };

        if (!fullEm) setAcc((p) => (p.find((e) => e.id === id) ? p : [...p, em]));
        fetchE();
        onAcceptEmergency(em);
      } else {
        alert(d.error || "Failed");
      }
    } catch {
      alert("Network error");
    }
  };

  // Format relative time
  const timeAgo = (d: string | Date) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b]">
      {/* Notification sidebar */}
      <NotificationSidebar
        open={sidebar}
        onClose={() => setSidebar(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={async (n) => {
          setSidebar(false);
          let m = acc.find((e) => e.id === n.emergencyId);
          
          if (!m && n.emergencyId) {
            try {
              const r = await fetch(`/api/doctor/accepted-emergencies?doctorId=${user?._id}`);
              if (r.ok) {
                const data = (await r.json()).emergencies || [];
                setAcc(data);
                m = data.find((e: any) => e.id === n.emergencyId);
              }
            } catch {}
          }
          
          if (m) onViewAccepted(m, n.type === "chat");
        }}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse" />
            <div>
              <h1 className="font-bold text-lg font-[Outfit]">{roleLabel} Dashboard</h1>
              <p className="text-[#475569] text-xs">
                {namePrefix}{user?.name} • {(user as any)?.specialization || roleLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell count={unreadCount} onClick={() => setSidebar(true)} />
            <button onClick={onOpenProfile} className="flex items-center gap-2 hover:bg-[#f1f5f9] px-2.5 py-2 rounded-xl transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {!currentLocation ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-6 text-center">
            <p className="text-[#f59e0b] font-semibold mb-2">📍 Location Required</p>
            <p className="text-[#475569] text-sm mb-4">Allow location access to receive emergency alerts within 5km.</p>
            <button onClick={() => window.location.reload()} className="bg-[#f59e0b]/20 text-[#f59e0b] px-4 py-2 rounded-xl text-sm">
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Active Emergencies */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
            <h2 className="text-lg font-bold text-[#10b981] font-[Outfit] mb-4">Active Emergencies</h2>
            {ems.length === 0 ? (
              <p className="text-[#94a3b8] text-center py-8">No active emergencies nearby</p>
            ) : (
              <div className="space-y-3">
                {ems.map((em) => (
                  <div key={em.id} className="bg-[#f8fafc] rounded-xl p-4 border-l-4 border-[#ef4444]">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
                          <span className="font-medium">{em.patientName}</span>
                          <span className="bg-[#ef4444]/10 text-[#ef4444] px-2 py-0.5 rounded text-xs">
                            {em.distance?.toFixed(1)} km
                          </span>
                        </div>
                        <p className="text-[#475569] text-sm">{em.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => accept(em.id)}
                          className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] px-4 py-2 rounded-xl text-sm transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accepted Cases */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#3b82f6] font-[Outfit]">Accepted ({acc.length})</h2>
              {unreadCount > 0 && (
                <span className="bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {acc.length === 0 ? (
              <p className="text-[#94a3b8] text-center py-6">No accepted cases</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acc.map((em, i) => (
                  <div
                    key={em.id || i}
                    className="bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl p-4 transition-all hover:border-[#3b82f6]/40 cursor-pointer"
                    onClick={() => { markAllRead(); onViewAccepted(em); }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#ef4444]/10 rounded-full flex items-center justify-center">
                        <span className="text-[#ef4444] font-bold text-sm">
                          {em.patientName?.charAt(0)?.toUpperCase() || "P"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{em.patientName}</h3>
                        <p className="text-[#94a3b8] text-xs">Emergency</p>
                      </div>
                    </div>
                    {em.description && <p className="text-[#475569] text-xs truncate mb-3">📋 {em.description}</p>}
                    <div className="flex gap-2">
                      <button className="flex-1 bg-[#3b82f6]/10 text-[#3b82f6] py-2 rounded-xl text-xs font-medium hover:bg-[#3b82f6]/20 transition-colors">
                        Details & Chat
                      </button>
                      {em.latitude && em.longitude && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onGetDirections(em); }}
                          className="bg-[#10b981]/10 text-[#10b981] py-2 px-3 rounded-xl text-xs font-medium hover:bg-[#10b981]/20 transition-colors"
                        >
                          📍
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Resolved Cases */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <button
              onClick={() => { setShowResolved(!showResolved); if (!showResolved) fetchR(); }}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f8fafc] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#8b5cf6] font-[Outfit]">
                  Resolved ({resolved.length})
                </h2>
              </div>
              <svg
                className={`w-5 h-5 text-[#94a3b8] transition-transform duration-200 ${showResolved ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showResolved && (
              <div className="px-6 pb-6 border-t border-[#e2e8f0]">
                {resolved.length === 0 ? (
                  <p className="text-[#94a3b8] text-center py-6">No resolved cases yet</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {resolved.map((em) => (
                      <div
                        key={em.id}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#8b5cf6] font-bold text-sm">
                                {em.patientName?.charAt(0)?.toUpperCase() || "P"}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{em.patientName}</h3>
                              <p className="text-[#94a3b8] text-xs">
                                {em.resolvedAt ? `Resolved ${timeAgo(em.resolvedAt)}` : `Created ${timeAgo(em.createdAt)}`}
                              </p>
                            </div>
                          </div>
                          <span className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-2.5 py-1 rounded-full text-xs font-medium">
                            Resolved
                          </span>
                        </div>
                        {em.description && (
                          <p className="text-[#475569] text-xs ml-12">📋 {em.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 bg-[#10b981] rounded-full" />
            <span className="text-[#1e293b] text-sm">Available for Emergencies (5km)</span>
            {currentLocation && (
              <span className="text-[#94a3b8] text-xs ml-auto">
                📍 {currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}