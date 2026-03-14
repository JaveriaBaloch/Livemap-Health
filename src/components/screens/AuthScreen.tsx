"use client";
import { useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import { useAppStore } from "@/lib/store";
export default function AuthScreen() {
  const { setUser } = useAppStore(); const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#e2e8f0] animate-slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#ef4444] to-[#f97316] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#ef4444]/20"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div>
          <h2 className="text-2xl font-bold text-[#1e293b] font-[Outfit]">LiveMap Emergency</h2>
          <p className="text-[#475569] mt-1">Access emergency medical services</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => setShow(true)} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-md shadow-[#3b82f6]/20">Sign In / Sign Up</button>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e2e8f0]" /></div><div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-[#94a3b8]">Emergency?</span></div></div>
          <button onClick={() => setUser({ name: "Emergency User", email: "emergency@example.com", _id: "emergency-access-" + Date.now(), role: "emergency-patient" as any })} className="w-full bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white font-bold py-4 px-6 rounded-xl transition-all animate-glow">🆘 EMERGENCY ACCESS</button>
          <p className="text-center text-xs text-[#94a3b8]">For patients & doctors • Available 24/7</p>
        </div>
      </div>
      {show && <AuthModal onClose={() => setShow(false)} />}
    </div>);
}