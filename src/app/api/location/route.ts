import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { latitude, longitude, address } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
    }

    // Update user location
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        address: address || "",
        lastLocationUpdate: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Location updated successfully",
      location: {
        latitude,
        longitude,
        address
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret");
    const emergencyId = searchParams.get("emergencyId");
    const radius = parseInt(searchParams.get("radius") || "5000");
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    let query: any = {
      isOnline: true,
      location: { $exists: true }
    };

    if (emergencyId) {
      // Get doctors responding to specific emergency
      const Emergency = (await import("@/models/Emergency")).default;
      const emergency = await Emergency.findById(emergencyId).populate("respondedDoctors");
      
      if (emergency) {
        const respondingDoctorIds = emergency.respondedDoctors.map((d: any) => d._id);
        query._id = { $in: respondingDoctorIds };
      }
    } else if (lat && lng) {
      // Get nearby medical professionals
      query.role = { $in: ["doctor", "paramedic", "nurse"] };
      query.availableForEmergency = true;
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      };
    }

    const users = await User.find(query)
      .select("name role specialization hospital location isOnline isAvailable currentEmergency phone")
      .limit(50);

    return NextResponse.json({ 
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        role: user.role,
        specialization: user.specialization,
        hospital: user.hospital,
        location: user.location,
        isOnline: user.isOnline,
        isAvailable: user.isAvailable,
        currentEmergency: user.currentEmergency,
        phone: user.phone
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error("Location fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch locations" }, { status: 500 });
  }
}