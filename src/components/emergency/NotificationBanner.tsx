"use client";

import { AlertTriangle, X, MapPin, Phone } from "lucide-react";

interface Props {
  notification: {
    type: string;
    message: string;
    emergency?: any;
  };
  onDismiss: () => void;
}

export default function NotificationBanner({ notification, onDismiss }: Props) {
  return (
    <div className="fixed top-4 left-4 right-4 z-[60] safe-area-top animate-slide-up">
      <div className="bg-emergency-600/95 backdrop-blur-lg rounded-2xl border border-emergency-400/30 shadow-[0_0_40px_rgba(255,59,59,0.3)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse-emergency">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-white text-sm">Emergency Alert!</p>
            <p className="text-xs text-white/80 mt-1">{notification.message}</p>
            {notification.emergency && (
              <div className="flex items-center gap-3 mt-2">
                {notification.emergency.reporterPhone && (
                  <a href={`tel:${notification.emergency.reporterPhone}`} className="flex items-center gap-1 text-xs text-white/90 bg-white/20 rounded-lg px-2.5 py-1.5">
                    <Phone size={12} /> Call Patient
                  </a>
                )}
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <MapPin size={12} /> {notification.emergency.address || "Location shared"}
                </span>
              </div>
            )}
          </div>
          <button onClick={onDismiss} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
            <X size={18} className="text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
}
