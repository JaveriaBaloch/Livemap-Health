"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { currentLocation, mapCenter } = useAppStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || document.querySelector('script[src*="maps.googleapis"]')) {
      if (window.google?.maps) setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const center = currentLocation || mapCenter;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f0f23" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e1e3e" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b3b6b" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a3d" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1a3e" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d2818" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1a3e" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [loaded, currentLocation, mapCenter]);

  // Update user marker
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    if (markerRef.current) {
      markerRef.current.setPosition(currentLocation);
    } else {
      markerRef.current = new google.maps.Marker({
        position: currentLocation,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#1e40af",
          strokeWeight: 3,
        },
        title: "You are here",
      });

      // Blue pulse ring
      new google.maps.Marker({
        position: currentLocation,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 25,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          strokeColor: "#3b82f6",
          strokeWeight: 1,
          strokeOpacity: 0.3,
        },
      });
    }

    mapInstanceRef.current.panTo(currentLocation);
  }, [currentLocation]);

  return (
    <div ref={mapRef} className="absolute inset-0 z-0">
      {!loaded && (
        <div className="absolute inset-0 bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-medical-500/30 border-t-medical-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
