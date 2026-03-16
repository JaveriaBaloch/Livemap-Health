"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";
import { NotificationBell } from "@/components/ui/NotificationSidebar";
import type { Specialist } from "@/types";

interface Props {
  specialist: Specialist;
  onBack: () => void;
  emergencyId?: string | null;
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  accepted: { label: "Accepted", color: "#10b981", icon: "✅" },
  "en-route": { label: "Doctor En Route", color: "#f59e0b", icon: "🚗" },
  arrived: { label: "Doctor Arrived", color: "#3b82f6", icon: "📍" },
  "in-progress": { label: "In Progress", color: "#8b5cf6", icon: "🩺" },
  resolved: { label: "Resolved", color: "#8b5cf6", icon: "🏁" },
};

export default function DirectionsMap({ specialist, onBack, emergencyId = null }: Props) {
  const { currentLocation, user } = useAppStore();
  const [mode, setMode] = useState<"driving" | "walking" | "transit">("driving");

  // DB notifications — only active when emergencyId + userId are available
  const { notifications, unreadCount } = useNotifications({
    userId: user?._id,
    enabled: !!emergencyId && !!user?._id,
    interval: 4000,
  });

  // Derive current status from latest DB notification for this emergency
  const statusNotifs = notifications.filter((n) => n.type === "status" && n.emergencyId === emergencyId);
  const currentStatus = statusNotifs.length > 0 ? statusNotifs[0].status : null;
  const doctorName = statusNotifs.length > 0 ? statusNotifs[0].fromUserName : null;

  const origin = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : "52.5200,13.4050";
  const dest = `${specialist.geometry.location.lat},${specialist.geometry.location.lng}`;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const statusInfo = emergencyId && currentStatus ? STATUS_DISPLAY[currentStatus] : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg font-[Outfit]">Directions</h1>
            <p className="text-[#475569] text-xs truncate max-w-[200px]">{specialist.name}</p>
          </div>
          {/* Live status badge on header when tracking emergency */}
          {statusInfo && (
            <div
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-xs font-semibold shadow-md"
              style={{ background: statusInfo.color }}
            >
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </div>
          )}
          {/* Notification bell */}
          {emergencyId && <NotificationBell count={unreadCount} onClick={onBack} />}
        </div>
      </div>

      {/* Emergency status banner */}
      {statusInfo && emergencyId && (
        <div
          className="border-b p-3 flex-shrink-0 transition-all duration-300"
          style={{ background: `${statusInfo.color}08`, borderColor: `${statusInfo.color}20` }}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: `${statusInfo.color}15` }}
            >
              {statusInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: statusInfo.color }}>
                {doctorName ? `Dr. ${doctorName}` : "Doctor"} — {statusInfo.label}
              </p>
              <p className="text-xs text-[#94a3b8]">
                {currentStatus === "en-route" && "Stay at your location, help is on the way"}
                {currentStatus === "arrived" && "Your doctor has arrived!"}
                {currentStatus === "resolved" && "This emergency has been resolved"}
                {currentStatus === "accepted" && "Preparing to depart"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Destination info */}
      <div className="bg-white border-b border-[#e2e8f0] p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-11 h-11 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{specialist.name}</h3>
            <p className="text-[#475569] text-sm truncate">{specialist.vicinity}</p>
            <p className="text-[#3b82f6] text-sm">{specialist.formatted_distance}</p>
          </div>
          <div className="flex gap-2">
            {specialist.formatted_phone_number && (
              <button
                onClick={() => window.open(`tel:${specialist.formatted_phone_number}`, "_self")}
                className="bg-[#10b981]/10 text-[#10b981] px-4 py-2 rounded-xl text-sm font-medium"
              >
                Call
              </button>
            )}
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank")}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Open Maps
            </button>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="bg-white border-b border-[#e2e8f0] p-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex justify-center gap-2">
          {([["driving", "Car", "#3b82f6"], ["walking", "Walk", "#10b981"], ["transit", "Transit", "#8b5cf6"]] as const).map(
            ([m, l, c]) => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === m ? "text-white shadow-md" : "bg-[#f1f5f9] text-[#475569] hover:text-[#1e293b]"
                }`}
                style={mode === m ? { background: c } : {}}
              >
                {l}
              </button>
            )
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[50vh]">
        <iframe
          key={mode}
          src={`https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${dest}&mode=${mode}`}
          width="100%"
          height="100%"
          style={{ border: 0, position: "absolute", inset: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-[#e2e8f0] p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex justify-center">
          <button
            onClick={() => {
              if (currentLocation)
                window.open(
                  `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${mode}`,
                  "_blank"
                );
            }}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-md shadow-[#3b82f6]/20"
          >
            Start Navigation
          </button>
        </div>
      </div>
    </div>
  );
}