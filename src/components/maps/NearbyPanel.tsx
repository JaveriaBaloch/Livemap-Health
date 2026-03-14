"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X, Building2, Pill, MapPin, Clock, Star, Phone, Navigation, Loader2 } from "lucide-react";

interface Props { onClose: () => void; }

export default function NearbyPanel({ onClose }: Props) {
  const { currentLocation } = useAppStore();
  const [activeType, setActiveType] = useState<"hospital" | "pharmacy">("hospital");
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const fetchPlaces = async () => {
    if (!currentLocation) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        lat: currentLocation.lat.toString(),
        lng: currentLocation.lng.toString(),
        type: activeType,
        radius: "5000",
      });
      if (keyword) params.set("keyword", keyword);

      const res = await fetch(`/api/hospitals?${params}`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaces(); }, [activeType, currentLocation]);
  useEffect(() => {
    const timer = setTimeout(() => { if (keyword) fetchPlaces(); }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const openDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  return (
    <div className="absolute inset-0 z-40 bg-dark-900/95 backdrop-blur-lg animate-fade-in flex flex-col">
      <div className="px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Nearby</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={22} className="text-slate-400" /></button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveType("hospital")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeType === "hospital" ? "bg-emergency-600 text-white" : "bg-dark-800 text-slate-400 border border-white/10"
            }`}
          >
            <Building2 size={16} /> Hospitals
          </button>
          <button
            onClick={() => setActiveType("pharmacy")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeType === "pharmacy" ? "bg-safe-600 text-white" : "bg-dark-800 text-slate-400 border border-white/10"
            }`}
          >
            <Pill size={16} /> Pharmacies
          </button>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={`Search ${activeType === "hospital" ? "hospitals" : "pharmacies"}...`}
          className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-medical-500" />
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No {activeType === "hospital" ? "hospitals" : "pharmacies"} found nearby</p>
          </div>
        ) : (
          places.map((place) => (
            <div key={place.place_id} className="bg-dark-800 rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm">{place.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {place.vicinity}
                  </p>
                </div>
                <span className="text-xs font-mono text-medical-400 ml-2 whitespace-nowrap">{place.distance} km</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                {place.rating && (
                  <span className="flex items-center gap-1 text-yellow-400"><Star size={12} fill="currentColor" /> {place.rating}</span>
                )}
                {place.opening_hours && (
                  <span className={`flex items-center gap-1 ${place.opening_hours.open_now ? "text-safe-400" : "text-emergency-400"}`}>
                    <Clock size={12} /> {place.opening_hours.open_now ? "Open" : "Closed"}
                  </span>
                )}
              </div>

              <button
                onClick={() => openDirections(place.geometry.location.lat, place.geometry.location.lng)}
                className="w-full py-2.5 bg-medical-600/20 text-medical-400 rounded-lg text-xs font-medium flex items-center justify-center gap-2 hover:bg-medical-600/30 transition-colors"
              >
                <Navigation size={14} /> Get Directions
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
