import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: "Invalid doctorId format" }, { status: 400 });
    }

    const doctorObjectId = new Types.ObjectId(doctorId);

    const resolvedEmergencies = await Emergency.find({
      status: "resolved",
      $or: [
        { acceptedBy: doctorObjectId },
        { respondedDoctors: doctorObjectId },
      ],
    })
      .populate("userId", "name phone")
      .populate("reportedBy", "name phone")
      .sort({ resolvedAt: -1 })
      .limit(50);

    const formatted = resolvedEmergencies.map((e) => {
      const patient = e.userId || e.reportedBy;
      return {
        id: e._id.toString(),
        patientId: (patient as any)?._id?.toString() || e.reportedBy?.toString(),
        patientName: (patient as any)?.name || e.patientName || e.reporterName || "Unknown",
        phoneNumber: (patient as any)?.phone || e.phoneNumber || e.reporterPhone,
        description: e.description,
        status: e.status,
        createdAt: e.createdAt,
        acceptedAt: e.acceptedAt,
        resolvedAt: e.resolvedAt,
        latitude: e.location?.coordinates?.[1] || e.latitude,
        longitude: e.location?.coordinates?.[0] || e.longitude,
      };
    });

    return NextResponse.json({
      success: true,
      emergencies: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error("Resolved emergencies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resolved emergencies", details: error.message },
      { status: 500 }
    );
  }
}