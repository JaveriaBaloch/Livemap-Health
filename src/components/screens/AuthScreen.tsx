"use client";

import { useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import { useAppStore } from "@/lib/store";

export default function AuthScreen() {
  const { setUser } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#e2e8f0] overflow-hidden">
          {/* Hero section */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] px-8 py-10 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 ring-1 ring-white/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white font-[Outfit] tracking-tight">LiveMap Emergency</h2>
              <p className="text-white/80 mt-1.5 text-sm">Emergency medical response platform</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 space-y-4">
            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-2">
              {[
                { icon: "📍", label: "Live Tracking" },
                { icon: "🩺", label: "Find Doctors" },
                { icon: "💬", label: "AI Assistant" },
                { icon: "🔔", label: "Real-time Alerts" },
              ].map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1 bg-[#f1f5f9] text-[#475569] text-xs px-3 py-1.5 rounded-full border border-[#e2e8f0]">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>

            {/* Sign in button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-[#3b82f6]/20 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign In / Sign Up
            </button>
          </div>
          </div>
        {/* Bottom trust bar */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[#94a3b8]">
          <div className="flex items-center gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Secure
          </div>
          <span className="text-[#e2e8f0]">•</span>
          <div className="flex items-center gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Instant
          </div>
          <span className="text-[#e2e8f0]">•</span>
          <div className="flex items-center gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            Verified Doctors
          </div>
        </div>
      </div>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  );
}