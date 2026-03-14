import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
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
    const { emergencyId } = await req.json();

    if (!emergencyId) {
      return NextResponse.json({ error: "Emergency ID is required" }, { status: 400 });
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    const doctor = await User.findById(decoded.userId);
    if (!doctor || !["doctor", "paramedic", "nurse"].includes(doctor.role)) {
      return NextResponse.json({ error: "Only medical professionals can respond" }, { status: 403 });
    }

    // Update emergency with responding doctor
    const updatedEmergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      { 
        $addToSet: { respondedDoctors: doctor._id },
        status: emergency.status === "active" ? "responded" : emergency.status
      },
      { new: true }
    ).populate("respondedDoctors", "name specialization hospital location phone");

    // Mark doctor as unavailable for other emergencies temporarily
    await User.findByIdAndUpdate(doctor._id, { 
      isAvailable: false,
      currentEmergency: emergencyId
    });

    return NextResponse.json({ 
      message: "Successfully responded to emergency",
      emergency: updatedEmergency,
      respondingDoctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        location: doctor.location,
        phone: doctor.phone
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Emergency response error:", error);
    return NextResponse.json({ error: error.message || "Failed to respond to emergency" }, { status: 500 });
  }
}