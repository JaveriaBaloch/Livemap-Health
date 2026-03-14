"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X, Search, Stethoscope, MapPin, Star, Phone, MessageCircle, Filter } from "lucide-react";

interface Props { onClose: () => void; }

const SPECIALIZATIONS = [
  "All", "General Practitioner", "Cardiologist", "Neurologist", "Orthopedist",
  "Pediatrician", "Dermatologist", "Emergency Medicine", "Surgeon", "Psychiatrist",
];

export default function SearchPanel({ onClose }: Props) {
  const { currentLocation } = useAppStore();
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("All");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentLocation) {
        params.set("lat", currentLocation.lat.toString());
        params.set("lng", currentLocation.lng.toString());
      }
      params.set("radius", "8000");
      if (query) params.set("search", query);
      if (specialization !== "All") params.set("specialization", specialization);

      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (query || specialization !== "All") searchDoctors(); }, 300);
    return () => clearTimeout(timer);
  }, [query, specialization]);

  useEffect(() => { searchDoctors(); }, []);

  return (
    <div className="absolute inset-0 z-40 bg-dark-900/95 backdrop-blur-lg animate-fade-in flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={22} className="text-slate-400" /></button>
          <h2 className="font-display font-bold text-lg">Find Doctors</h2>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialization, hospital..."
            className="w-full bg-dark-800 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50"
          />
          <button onClick={() => setShowFilters(!showFilters)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${showFilters ? "bg-medical-500/20 text-medical-400" : "text-slate-500 hover:text-slate-300"}`}>
            <Filter size={16} />
          </button>
        </div>

        {/* Specialization filter */}
        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {SPECIALIZATIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpecialization(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  specialization === s
                    ? "bg-medical-500 text-white"
                    : "bg-dark-800 text-slate-400 border border-white/10 hover:border-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-medical-500/30 border-t-medical-500 rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
            <p>No doctors found nearby</p>
            <p className="text-xs mt-1">Try broadening your search</p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div key={doc._id} className="bg-dark-800 rounded-xl border border-white/5 p-4 hover:border-medical-500/20 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-white">{doc.name}</h3>
                  <p className="text-sm text-medical-400">{doc.specialization || "Medical Professional"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {doc.isOnline && <div className="w-2 h-2 rounded-full bg-safe-400" />}
                  {doc.distance != null && (
                    <span className="text-xs text-slate-500 font-mono ml-2">{doc.distance} km</span>
                  )}
                </div>
              </div>

              {doc.hospital && (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <MapPin size={12} /> {doc.hospital}
                </div>
              )}

              {doc.rating > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-400 mb-3">
                  <Star size={12} fill="currentColor" /> {doc.rating.toFixed(1)} ({doc.reviewCount} reviews)
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {doc.phone && (
                  <a href={`tel:${doc.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-safe-600/20 text-safe-400 rounded-lg text-xs font-medium hover:bg-safe-600/30 transition-colors">
                    <Phone size={14} /> Call
                  </a>
                )}
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-medical-600/20 text-medical-400 rounded-lg text-xs font-medium hover:bg-medical-600/30 transition-colors">
                  <MessageCircle size={14} /> Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
