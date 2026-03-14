import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// GET nearby hospitals
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const type = searchParams.get("type") || "hospital"; // hospital, pharmacy, doctor
    const radius = searchParams.get("radius") || "5000";
    const keyword = searchParams.get("keyword") || "";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
    }

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;

    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: `Google Places API error: ${data.status}`, details: data.error_message }, { status: 500 });
    }

    // Add distance to results
    const results = (data.results || []).map((place: any) => {
      const plat = place.geometry.location.lat;
      const plng = place.geometry.location.lng;
      const distance = getDistanceKm(parseFloat(lat), parseFloat(lng), plat, plng);
      return { ...place, distance: Math.round(distance * 100) / 100 };
    });

    // Sort by distance
    results.sort((a: any, b: any) => a.distance - b.distance);

    return NextResponse.json({ places: results, count: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
