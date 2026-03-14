"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, AlertTriangle, Send, MapPin, Heart, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function EmergencyModal({ onClose }: Props) {
  const { user, currentLocation, setActiveEmergency } = useAppStore();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium" | "low">("high");
  const [emergencyType, setEmergencyType] = useState<string>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!user || !currentLocation || !description) return;
    setLoading(true);

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedBy: user._id,
          reporterName: user.name,
          reporterPhone: user.phone,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          description,
          severity,
          emergencyType,
          healthData: {
            bloodGroup: user.bloodGroup,
            allergies: user.allergies,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveEmergency(data.emergency);
        setResult(data);
      }
    } catch (err) {
      console.error("Emergency alert failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-dark-800 rounded-2xl border border-emergency-500/30 shadow-[0_0_60px_rgba(255,59,59,0.15)] animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emergency-600/20 to-emergency-800/20 border-b border-emergency-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emergency-500/20 flex items-center justify-center">
              <AlertTriangle size={22} className="text-emergency-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">Emergency Alert</h2>
              <p className="text-xs text-emergency-300/70">Notify nearby doctors within 8km</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {!result ? (
          <div className="p-6 space-y-5">
            {/* Location */}
            {currentLocation && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-dark-900/50 rounded-xl px-4 py-3">
                <MapPin size={16} className="text-medical-400" />
                <span>Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
              </div>
            )}

            {/* Severity */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {(["critical", "high", "medium", "low"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all border ${
                      severity === s
                        ? s === "critical" ? "bg-emergency-600 border-emergency-500 text-white"
                        : s === "high" ? "bg-orange-600 border-orange-500 text-white"
                        : s === "medium" ? "bg-yellow-600 border-yellow-500 text-white"
                        : "bg-safe-600 border-safe-500 text-white"
                        : "bg-dark-900/50 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Type */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Emergency Type</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full px-4 py-3 bg-dark-900/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none"
              >
                <option value="general">General Emergency</option>
                <option value="cardiac">Cardiac/Heart Emergency</option>
                <option value="respiratory">Respiratory/Breathing</option>
                <option value="neurological">Stroke/Neurological</option>
                <option value="trauma">Trauma/Accident</option>
                <option value="pediatric">Pediatric Emergency</option>
                <option value="psychiatric">Mental Health Crisis</option>
                <option value="poisoning">Poisoning/Overdose</option>
                <option value="allergic">Allergic Reaction</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">What's happening?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the emergency (e.g., chest pain, difficulty breathing, accident...)"
                className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emergency-500/50 resize-none h-24"
              />
            </div>

            {/* Health Info */}
            {user?.bloodGroup && (
              <div className="flex items-center gap-2 text-sm bg-dark-900/50 rounded-xl px-4 py-3">
                <Heart size={16} className="text-emergency-400" />
                <span className="text-slate-400">Blood: <strong className="text-white">{user.bloodGroup}</strong></span>
                {user.allergies && user.allergies.length > 0 && (
                  <span className="text-slate-400 ml-3">Allergies: <strong className="text-yellow-400">{user.allergies.join(", ")}</strong></span>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !description}
              className="w-full py-4 bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-400 rounded-xl font-display font-bold text-white tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Sending Alert...</>
              ) : (
                <><Send size={20} /> SEND EMERGENCY ALERT</>
              )}
            </button>
          </div>
        ) : (
          /* Result */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-safe-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-safe-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Alert Sent!</h3>
            <p className="text-slate-400">
              <strong className="text-safe-400">{result.notifiedDoctors}</strong> medical professionals nearby have been notified.
            </p>
            {result.doctors && result.doctors.length > 0 && (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Notified Responders:</p>
                {result.doctors.slice(0, 5).map((doc: any) => (
                  <div key={doc._id} className="bg-dark-900/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{doc.name}</p>
                      <p className="text-xs text-slate-400">{doc.specialization || "Medical Professional"}</p>
                    </div>
                    <span className="text-xs text-medical-400 font-mono">{doc.phone}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={onClose} className="w-full py-3 bg-dark-900/50 rounded-xl text-slate-300 hover:bg-dark-900 transition-colors mt-4">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
