"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, MapPin, Clock, Phone, Star, Pill } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  location: {
    coordinates: [number, number];
  };
  phone: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  openingHours: {
    [key: string]: { open: string; close: string; };
  };
  services: string[];
  distance?: number;
  estimatedTime?: number;
}

interface Props {
  onBack: () => void;
  onSelect: (pharmacy: Pharmacy) => void;
}

export default function PharmacySearch({ onBack, onSelect }: Props) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState("all");
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const { currentLocation } = useAppStore();

  const filterOptions = [
    { id: "all", name: "All Pharmacies" },
    { id: "open", name: "Open Now" },
    { id: "24h", name: "24/7 Service" },
    { id: "nearby", name: "Nearby (<1km)" },
  ];

  const commonServices = [
    "Prescription Medicines", "OTC Medicines", "Health Consultation", 
    "Blood Pressure Check", "Diabetes Monitoring", "Vaccination",
    "First Aid", "Medical Equipment", "Home Delivery"
  ];

  useEffect(() => {
    fetchPharmacies();
  }, [currentLocation]);

  useEffect(() => {
    filterPharmacies();
  }, [pharmacies, searchQuery, filterOpen]);

  const fetchPharmacies = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pharmacies?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=5000`
      );
      const data = await response.json();
      setPharmacies(data.pharmacies || []);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPharmacies = () => {
    let filtered = pharmacies;

    // Filter by status
    if (filterOpen === "open") {
      filtered = filtered.filter(p => p.isOpen);
    } else if (filterOpen === "24h") {
      filtered = filtered.filter(p => 
        p.services.includes("24/7 Service") || p.services.includes("24 Hour")
      );
    } else if (filterOpen === "nearby") {
      filtered = filtered.filter(p => (p.distance || 0) < 1000);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.services.some(service => 
          service.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredPharmacies(filtered);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return "";
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  const formatTime = (time?: number) => {
    if (!time) return "";
    return time < 60 ? `${Math.round(time)} min` : `${Math.round(time / 60)}h ${time % 60} min`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-400"}
      />
    ));
  };

  const getCurrentDayHours = (pharmacy: Pharmacy) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const todayHours = pharmacy.openingHours?.[today];
    if (!todayHours || todayHours.open === "closed") return "Closed today";
    return `${todayHours.open} - ${todayHours.close}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-safe-500/30 border-t-safe-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Finding pharmacies near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div className="bg-dark-800/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-dark-700 hover:bg-dark-600 rounded-xl flex items-center justify-center transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-bold text-xl">Find Pharmacies</h1>
              <p className="text-slate-400 text-sm">{filteredPharmacies.length} pharmacies found</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search pharmacies, medicines, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-safe-500 focus:ring-1 focus:ring-safe-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilterOpen(option.id)}
                className={`
                  px-4 py-2 rounded-lg whitespace-nowrap text-sm transition-all
                  ${filterOpen === option.id
                    ? "bg-safe-500 text-white"
                    : "bg-dark-800 text-slate-400 hover:bg-dark-700"
                  }
                `}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pharmacies List */}
        {filteredPharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Pill size={64} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No pharmacies found</h3>
            <p className="text-slate-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredPharmacies.map((pharmacy) => (
              <div
                key={pharmacy._id}
                className="bg-dark-800/50 border border-white/10 rounded-xl p-6 hover:border-safe-500/30 transition-all cursor-pointer group"
                onClick={() => onSelect(pharmacy)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-safe-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Pill size={24} className="text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-safe-400 transition-colors">
                          {pharmacy.name}
                        </h3>
                        <p className="text-slate-400 text-sm">{pharmacy.address}</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          pharmacy.isOpen ? "bg-safe-400" : "bg-slate-500"
                        }`} />
                        <span className="text-xs text-slate-400">
                          {pharmacy.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        {renderStars(pharmacy.rating)}
                        <span className="text-slate-400 ml-1">
                          {pharmacy.rating} ({pharmacy.reviewCount})
                        </span>
                      </div>
                      
                      {pharmacy.distance && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin size={12} />
                          {formatDistance(pharmacy.distance)}
                        </div>
                      )}
                      
                      {pharmacy.estimatedTime && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock size={12} />
                          {formatTime(pharmacy.estimatedTime)}
                        </div>
                      )}
                    </div>

                    {/* Opening Hours */}
                    <div className="mb-3">
                      <p className="text-slate-400 text-sm">
                        <Clock size={12} className="inline mr-1" />
                        {getCurrentDayHours(pharmacy)}
                      </p>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {pharmacy.services.slice(0, 3).map((service) => (
                          <span
                            key={service}
                            className="px-2 py-1 bg-safe-500/20 text-safe-400 text-xs rounded"
                          >
                            {service}
                          </span>
                        ))}
                        {pharmacy.services.length > 3 && (
                          <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded">
                            +{pharmacy.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${pharmacy.phone}`;
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-safe-600 hover:bg-safe-500 rounded-lg transition-all text-sm"
                      >
                        <Phone size={14} />
                        Call
                      </button>
                      
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {pharmacy.isOpen ? "Open Now" : "Closed"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
