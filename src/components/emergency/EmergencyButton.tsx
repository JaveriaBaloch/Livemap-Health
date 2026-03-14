"use client";

import { Shield } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function EmergencyButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative group"
      aria-label="Emergency Alert"
    >
      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 rounded-full border-2 border-emergency-500/30 animate-[ripple_2s_ease-out_infinite]" />
        <div className="absolute w-24 h-24 rounded-full border-2 border-emergency-500/20 animate-[ripple_2s_ease-out_infinite_0.5s]" />
        <div className="absolute w-24 h-24 rounded-full border-2 border-emergency-500/10 animate-[ripple_2s_ease-out_infinite_1s]" />
      </div>

      {/* Button */}
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emergency-500 to-emergency-700 shadow-[0_0_40px_rgba(255,59,59,0.4)] flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all duration-200">
        <Shield size={32} className="text-white" strokeWidth={2.5} />
      </div>

      {/* Label */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-display font-semibold text-emergency-400 tracking-wider uppercase">
          SOS Alert
        </span>
      </div>
    </button>
  );
}
