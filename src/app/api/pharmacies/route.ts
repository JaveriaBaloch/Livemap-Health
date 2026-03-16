import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// Pharmacy Schema
const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number], // [lng, lat]
  },
  phone: { type: String, required: true },
  rating: { type: Number, default: 4.0 },
  reviewCount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  openingHours: {
    mon: { open: String, close: String },
    tue: { open: String, close: String },
    wed: { open: String, close: String },
    thu: { open: String, close: String },
    fri: { open: String, close: String },
    sat: { open: String, close: String },
    sun: { open: String, close: String },
  },
  services: [String],
  owner: { type: String },
  website: { type: String },
  email: { type: String },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

pharmacySchema.index({ location: "2dsphere" });

const Pharmacy = mongoose.models.Pharmacy || mongoose.model("Pharmacy", pharmacySchema);

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseInt(searchParams.get("radius") || "5000");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Location coordinates are required" },
        { status: 400 }
      );
    }

    // Use Google Places API to find real pharmacies
    const placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!placesApiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Search for pharmacies using Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&key=${placesApiKey}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API error: ${placesData.status}` },
        { status: 500 }
      );
    }

    // Transform Google Places data to our pharmacy format
    const pharmacies = placesData.results.slice(0, limit).map((place: any) => {
      const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      const estimatedTime = Math.max(5, Math.round(distance / 1000 * 3));
      
      return {
        _id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || "Address not available",
        location: {
          coordinates: [place.geometry.location.lng, place.geometry.location.lat]
        },
        phone: "", // Will be filled by Place Details API if needed
        rating: place.rating || 4.0,
        reviewCount: place.user_ratings_total || 0,
        isOpen: place.opening_hours?.open_now ?? true,
        openingHours: {
          mon: { open: "08:00", close: "20:00" },
          tue: { open: "08:00", close: "20:00" },
          wed: { open: "08:00", close: "20:00" },
          thu: { open: "08:00", close: "20:00" },
          fri: { open: "08:00", close: "20:00" },
          sat: { open: "09:00", close: "18:00" },
          sun: { open: "10:00", close: "16:00" },
        },
        services: place.types?.includes('pharmacy') ? ["Prescription Medicines", "OTC Medicines"] : ["Medical Services"],
        distance: Math.round(distance),
        estimatedTime,
        priceLevel: place.price_level,
        placeId: place.place_id,
      };
    });

    // Sort by distance
    pharmacies.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({
      success: true,
      pharmacies,
      count: pharmacies.length,
      source: "google_places"
    });
  } catch (error: any) {
    console.error("Get pharmacies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}