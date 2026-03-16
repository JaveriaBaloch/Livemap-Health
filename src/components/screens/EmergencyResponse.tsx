"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";
import EmergencyChat from "@/components/ui/EmergencyChat";
import NotificationSidebar, { NotificationBell } from "@/components/ui/NotificationSidebar";
import type { EmergencyData } from "@/types";

interface Props {
  emergency: EmergencyData;
  onBack: () => void;
  onGetDirections: (e: EmergencyData) => void;
  autoOpenChat?: boolean;
}

const STATUS_STEPS = [
  { key: "accepted", label: "Accepted", icon: "✅", color: "#10b981" },
  { key: "en-route", label: "En Route", icon: "🚗", color: "#f59e0b" },
  { key: "arrived", label: "Arrived", icon: "📍", color: "#3b82f6" },
  { key: "resolved", label: "Resolved", icon: "🏁", color: "#8b5cf6" },
];

export default function EmergencyResponse({ emergency, onBack, onGetDirections, autoOpenChat = false }: Props) {
  const { user } = useAppStore();
  const [showChat, setShowChat] = useState(autoOpenChat);
  const [sidebar, setSidebar] = useState(false);
  // Normalize status for the stepper (DB may store "responded" which maps to "accepted")
  const normalizeStatus = (s?: string) => {
    if (!s || s === "responded" || s === "active") return "accepted";
    return s;
  };
  const [currentStatus, setCurrentStatus] = useState(normalizeStatus(emergency.status));
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    userId: user?._id,
    enabled: !!user?._id,
    interval: 4000,
  });

  const phone = emergency.phoneNumber || emergency.reporterPhone;

  const updateStatus = async (newStatus: string) => {
    const emId = emergency.id || (emergency as any)._id;
    console.log("updateStatus called:", { newStatus, emId, userId: user?._id, emergency });
    
    if (!user?._id || !emId) {
      console.error("Cannot update status - missing:", { userId: user?._id, emId });
      setStatusError("Missing emergency or user ID");
      return;
    }

    if (newStatus === "resolved" && !confirm("Mark this emergency as resolved?")) return;

    setUpdating(true);
    setStatusError("");

    try {
      const res = await fetch("/api/emergency/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyId: emId,
          doctorId: user._id,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setCurrentStatus(newStatus);

      if (newStatus === "resolved") {
        setTimeout(() => onBack(), 1500);
      }
    } catch (err: any) {
      setStatusError(err.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  // Find current step index
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] relative">
      {/* Notification sidebar */}
      <NotificationSidebar
        open={sidebar}
        onClose={() => setSidebar(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={() => { setSidebar(false); markAllRead(); setShowChat(true); }}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {/* Header */}
      <div className="bg-[#ef4444]/5 backdrop-blur-xl border-b border-[#ef4444]/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-[#f1f5f9] rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-2.5 h-2.5 bg-[#ef4444] rounded-full animate-pulse" />
            <h1 className="font-bold text-lg font-[Outfit]">Emergency Response</h1>
          </div>
          <NotificationBell count={unreadCount} onClick={() => setSidebar(true)} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status Progress */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#475569] font-[Outfit] mb-4 uppercase tracking-wider">Response Status</h2>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="absolute top-4 right-1/2 w-full h-0.5" style={{ left: "-50%" }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ background: idx <= currentIdx ? step.color : "#e2e8f0" }}
                      />
                    </div>
                  )}
                  {/* Circle */}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                      isCurrent
                        ? "ring-4 scale-110"
                        : isCompleted
                        ? ""
                        : "bg-[#f1f5f9] text-[#94a3b8]"
                    }`}
                    style={
                      isCompleted
                        ? { background: `${step.color}15`, color: step.color, boxShadow: `0 0 0 4px ${step.color}20` }
                        : {}
                    }
                  >
                    {isCompleted ? step.icon : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isCurrent ? "text-[#1e293b]" : isCompleted ? "text-[#475569]" : "text-[#94a3b8]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => (phone ? window.open(`tel:${phone}`, "_self") : alert("No phone"))}
            className="bg-[#10b981] hover:bg-[#059669] text-white py-4 px-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-[#10b981]/10"
          >
            <div>
              <div className="font-bold font-[Outfit]">Call Patient</div>
              <div className="text-sm opacity-80">{phone || "N/A"}</div>
            </div>
          </button>
          <button
            onClick={() => onGetDirections(emergency)}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white py-4 px-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-[#3b82f6]/10"
          >
            <div>
              <div className="font-bold font-[Outfit]">Get Directions</div>
              <div className="text-sm opacity-80">Live Navigation</div>
            </div>
          </button>
          <button
            onClick={() => {
              if (!(emergency.id || (emergency as any)._id) || !emergency.patientId) { alert("Not available"); return; }
              markAllRead();
              setShowChat(true);
            }}
            className={`bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-4 px-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-[#8b5cf6]/10 relative ${unreadCount > 0 ? "ring-2 ring-[#8b5cf6]/30" : ""}`}
          >
            <div>
              <div className="font-bold font-[Outfit]">Chat</div>
              <div className="text-sm opacity-80">{unreadCount > 0 ? `${unreadCount} new` : "Message Patient"}</div>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#ef4444] text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-[#f8fafc]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Chat */}
        {showChat && (emergency.id || (emergency as any)._id) && emergency.patientId && (
          <EmergencyChat
            emergencyId={emergency.id || (emergency as any)._id}
            otherUserId={emergency.patientId}
            otherUserName={emergency.patientName || "Patient"}
            onClose={() => setShowChat(false)}
            title="Chat with Patient"
          />
        )}

        {/* Patient Information */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#ef4444] font-[Outfit] mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center">
                  <span className="text-[#3b82f6] font-bold text-lg">
                    {emergency.patientName?.charAt(0)?.toUpperCase() || "P"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold font-[Outfit]">{emergency.patientName || "Patient"}</h3>
                  <p className="text-[#94a3b8] text-sm">Emergency Contact</p>
                </div>
              </div>
              <p className="text-[#475569] text-sm">Age: {emergency.age || "N/A"}</p>
              <p className="text-[#475569] text-sm">Phone: {phone || "N/A"}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-[#f59e0b]">Medical Info</h4>
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <span className="text-[#ef4444] text-xs font-medium">Blood</span>
                <p className="text-[#1e293b] font-bold">{emergency.bloodGroup || "Unknown"}</p>
              </div>
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <span className="text-[#f59e0b] text-xs font-medium">Allergies</span>
                <p className="text-[#1e293b] text-sm">
                  {emergency.allergies?.length ? emergency.allergies.join(", ") : "None"}
                </p>
              </div>
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <span className="text-[#3b82f6] text-xs font-medium">Conditions</span>
                <p className="text-[#1e293b] text-sm">
                  {emergency.medicalConditions?.length ? emergency.medicalConditions.join(", ") : "None"}
                </p>
              </div>
            </div>
          </div>
          {emergency.description && (
            <div className="mt-5 bg-[#ef4444]/5 border border-[#ef4444]/20 p-4 rounded-xl">
              <h4 className="text-[#ef4444] font-semibold text-sm mb-1">Description</h4>
              <p className="text-[#1e293b] text-sm">{emergency.description}</p>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#3b82f6] font-[Outfit] mb-4">Update Status</h2>

          {statusError && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3 mb-4 text-sm text-[#ef4444]">
              {statusError}
            </div>
          )}

          {currentStatus === "resolved" ? (
            <div className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🏁</div>
              <p className="text-[#8b5cf6] font-bold font-[Outfit] text-lg">Case Resolved</p>
              <p className="text-[#475569] text-sm mt-1">This emergency has been marked as resolved. Redirecting…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* En Route */}
              <button
                onClick={() => updateStatus("en-route")}
                disabled={updating || currentIdx >= 1}
                className={`py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  currentIdx >= 1
                    ? "bg-[#f59e0b]/10 text-[#f59e0b]/50 cursor-not-allowed border border-[#f59e0b]/10"
                    : "bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border border-[#f59e0b]/20"
                }`}
              >
                {currentIdx >= 1 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                🚗 {currentIdx >= 1 ? "En Route ✓" : updating ? "Updating…" : "Mark En Route"}
              </button>

              {/* Arrived */}
              <button
                onClick={() => updateStatus("arrived")}
                disabled={updating || currentIdx < 1 || currentIdx >= 2}
                className={`py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  currentIdx >= 2
                    ? "bg-[#10b981]/10 text-[#10b981]/50 cursor-not-allowed border border-[#10b981]/10"
                    : currentIdx < 1
                    ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]"
                    : "bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 border border-[#10b981]/20"
                }`}
              >
                {currentIdx >= 2 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                📍 {currentIdx >= 2 ? "Arrived ✓" : currentIdx < 1 ? "Arrived" : updating ? "Updating…" : "Mark Arrived"}
              </button>

              {/* Resolved */}
              <button
                onClick={() => updateStatus("resolved")}
                disabled={updating || currentIdx < 2}
                className={`py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  currentIdx < 2
                    ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]"
                    : "bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20"
                }`}
              >
                🏁 {updating ? "Updating…" : "Mark Resolved"}
              </button>

              {/* Call 144 — always active */}
              <button
                onClick={() => window.open("tel:144", "_self")}
                className="bg-[#ef4444]/10 text-[#ef4444] py-3.5 rounded-xl text-sm font-medium hover:bg-[#ef4444]/20 transition-colors border border-[#ef4444]/20"
              >
                🚨 Call 144
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}