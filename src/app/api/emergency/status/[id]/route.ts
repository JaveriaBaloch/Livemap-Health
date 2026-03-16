import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import User from "@/models/User";

// GET /api/emergency/status/[id] — fetch emergency status, responding doctors, accepted doctor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
    }

    const emergency = await Emergency.findById(id)
      .populate("acceptedBy", "name phone specialization location role experience hospital")
      .populate("respondedDoctors", "name phone specialization location role")
      .populate("reportedBy", "name phone bloodGroup allergies medicalConditions age")
      .populate("userId", "name phone bloodGroup allergies medicalConditions age")
      .lean() as any;

    if (!emergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    // Format accepted doctor info
    let acceptedDoctor = null;
    if (emergency.acceptedBy && typeof emergency.acceptedBy === "object") {
      const doc = emergency.acceptedBy;
      acceptedDoctor = {
        doctorId: doc._id?.toString(),
        doctorName: doc.name,
        name: doc.name,
        specialization: doc.specialization || doc.role || "General Practice",
        phone: doc.phone,
        role: doc.role,
        location: doc.location?.coordinates
          ? { lat: doc.location.coordinates[1], lng: doc.location.coordinates[0] }
          : null,
        estimatedArrival: "5-10 minutes",
        status: "accepted",
      };
    }

    // Format responding doctors list
    const respondingDoctors = (emergency.respondedDoctors || [])
      .filter((d: any) => d && typeof d === "object")
      .map((d: any) => ({
        doctorId: d._id?.toString(),
        doctorName: d.name,
        specialization: d.specialization || d.role || "General Practice",
        phone: d.phone,
        location: d.location?.coordinates
          ? { lat: d.location.coordinates[1], lng: d.location.coordinates[0] }
          : null,
        status: d._id?.toString() === emergency.acceptedBy?._id?.toString() ? "accepted" : "responded",
      }));

    // Get patient info
    const patient: any = emergency.userId || emergency.reportedBy;
    const pd = patient && typeof patient === "object" && patient.name ? patient : null;

    return NextResponse.json({
      success: true,
      emergency: {
        id: emergency._id.toString(),
        status: emergency.status,
        description: emergency.description,
        severity: emergency.severity,
        createdAt: emergency.createdAt,
        acceptedAt: emergency.acceptedAt,
        resolvedAt: emergency.resolvedAt,
        patientName: emergency.reporterName || emergency.patientName || pd?.name,
        patientId: pd?._id?.toString() || emergency.reportedBy?.toString(),
        phoneNumber: emergency.phoneNumber || emergency.reporterPhone || pd?.phone,
        age: emergency.age || pd?.age,
        bloodGroup: emergency.bloodGroup || emergency.healthData?.bloodGroup || pd?.bloodGroup,
        allergies: emergency.allergies || pd?.allergies || emergency.healthData?.allergies || [],
        medicalConditions: emergency.medicalConditions || pd?.medicalConditions || emergency.healthData?.conditions || [],
        latitude: emergency.location?.coordinates?.[1] || emergency.latitude,
        longitude: emergency.location?.coordinates?.[0] || emergency.longitude,
        address: emergency.address,
      },
      acceptedDoctor,
      respondingDoctors,
    });
  } catch (error: any) {
    console.error("Get emergency status error:", error);
    return NextResponse.json(
      { error: "Failed to get emergency status", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/emergency/status/[id] — cancel emergency
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
    }

    const emergency = await Emergency.findById(id);
    if (!emergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    if (action === "cancel") {
      emergency.status = "cancelled";
      await emergency.save();

      console.log(`Emergency ${id} cancelled`);

      return NextResponse.json({
        success: true,
        message: "Emergency cancelled",
        emergency: {
          id: emergency._id.toString(),
          status: "cancelled",
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Update emergency status error:", error);
    return NextResponse.json(
      { error: "Failed to update emergency", details: error.message },
      { status: 500 }
    );
  }
}