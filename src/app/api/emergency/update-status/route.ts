import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import User from "@/models/User";

const MEDICAL_ROLES = ["doctor", "nurse", "paramedic"];
const VALID_STATUSES = ["en-route", "arrived", "resolved", "in-progress"];

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { emergencyId, doctorId, status, notes } = body;

    if (!emergencyId || !doctorId || !status) {
      return NextResponse.json(
        { error: "emergencyId, doctorId, and status are required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the medical staff
    const doctor = await User.findById(doctorId);
    if (!doctor || !MEDICAL_ROLES.includes(doctor.role)) {
      return NextResponse.json({ error: "Invalid medical staff" }, { status: 404 });
    }

    // Get the emergency
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    // Verify this doctor is the one who accepted
    const acceptedById = emergency.acceptedBy?.toString();
    if (acceptedById !== doctorId) {
      return NextResponse.json(
        { error: "Only the accepting responder can update status" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = { status };

    if (status === "en-route") {
      updateData.enRouteAt = new Date();
    } else if (status === "arrived") {
      updateData.arrivedAt = new Date();
    } else if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    if (notes) {
      updateData.resolutionNotes = notes;
    }

    const updated = await Emergency.findByIdAndUpdate(emergencyId, updateData, {
      new: true,
      runValidators: true,
      strict: false, // Allow enRouteAt/arrivedAt even if not in schema
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    console.log(
      `Emergency ${emergencyId} status updated to "${status}" by ${doctor.role} ${doctor.name}`
    );

    return NextResponse.json({
      success: true,
      message: `Emergency status updated to ${status}`,
      emergency: {
        id: updated._id.toString(),
        status: updated.status,
        enRouteAt: updated.enRouteAt,
        arrivedAt: updated.arrivedAt,
        resolvedAt: updated.resolvedAt,
        updatedBy: {
          id: doctor._id.toString(),
          name: doctor.name,
          role: doctor.role,
        },
      },
    });
  } catch (error: any) {
    console.error("Update emergency status error:", error);
    return NextResponse.json(
      {
        error: "Failed to update emergency status",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}