"use client";
export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-10 text-center animate-slide-up">
        <div className="space-y-5">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#ef4444] to-[#f97316] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ef4444]/20"><svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
          <h1 className="text-4xl font-bold text-[#1e293b] font-[Outfit] tracking-tight">LiveMap <span className="text-[#ef4444]">Emergency</span></h1>
          <p className="text-[#475569] text-lg">Connect with medical professionals instantly</p>
        </div>
        <div className="space-y-3 text-left">
          {[{ c: "bg-[#10b981]", l: "Find nearby specialists & pharmacies" },{ c: "bg-[#3b82f6]", l: "Emergency SOS with real-time location" },{ c: "bg-[#8b5cf6]", l: "Connect with verified healthcare providers" },{ c: "bg-[#ef4444]", l: "Secure & private medical assistance" }].map((i, x) => (
            <div key={x} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-[#e2e8f0] shadow-sm"><div className={`w-2 h-2 rounded-full ${i.c}`} /><span className="text-[#1e293b] text-sm">{i.l}</span></div>
          ))}
        </div>
        <button onClick={() => { localStorage.setItem("livemap_welcome_complete", "true"); onComplete(); }} className="w-full bg-gradient-to-r from-[#ef4444] to-[#f97316] hover:from-[#dc2626] hover:to-[#ea580c] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#ef4444]/20">Get Started</button>
        <p className="text-xs text-[#94a3b8]">By continuing, you agree to our Terms of Service</p>
      </div>
    </div>);
}