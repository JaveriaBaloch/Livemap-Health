import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET nearby doctors with optional specialization filter
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "8000"); // meters
    const specialization = searchParams.get("specialization") || "";
    const search = searchParams.get("search") || "";
    const available = searchParams.get("available");

    const query: any = { role: "doctor" };

    // Text search on name or specialization
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { hospital: { $regex: search, $options: "i" } },
      ];
    }

    // Specialization filter
    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    // Availability filter
    if (available === "true") {
      query.availableForEmergency = true;
      query.isOnline = true;
    }

    // Geospatial query if coordinates provided
    if (lat && lng) {
      query.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      };
    }

    const doctors = await User.find(query)
      .select("-password")
      .limit(50)
      .lean();

    // Calculate distance for each doctor
    const doctorsWithDistance = doctors.map((doc: any) => {
      if (lat && lng && doc.location?.coordinates) {
        const [dLng, dLat] = doc.location.coordinates;
        const distance = getDistanceKm(lat, lng, dLat, dLng);
        return { ...doc, distance: Math.round(distance * 100) / 100 };
      }
      return doc;
    });

    return NextResponse.json({ doctors: doctorsWithDistance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Haversine distance in km
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

// GET specialization list
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const specializations = await User.distinct("specialization", {
      role: "doctor",
      specialization: { $nin: [null, ""] },

    });
    return NextResponse.json({ specializations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
