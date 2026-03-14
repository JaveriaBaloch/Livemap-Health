import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import User from "@/models/User";
import Chat from "@/models/Chat";
import Pusher from "pusher";

let pusher: Pusher | null = null;
try {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });
} catch (e) {
  console.log("Pusher not configured");
}

// GET active emergencies or specific emergency
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "active";

    if (id) {
      const emergency = await Emergency.findById(id).lean();
      return NextResponse.json({ emergency });
    }

    let query: any = { status };
    if (userId) {
      query.$or = [{ reportedBy: userId }, { notifiedDoctors: userId }];
    }

    const emergencies = await Emergency.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ emergencies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE emergency alert - notifies nearby doctors within 8km
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { reportedBy, reporterName, reporterPhone, latitude, longitude, address, description, severity, healthData, emergencyType } = body;

    // Create emergency
    const emergency = await Emergency.create({
      reportedBy,
      reporterName,
      reporterPhone,
      location: { type: "Point", coordinates: [longitude, latitude] },
      address,
      description,
      severity: severity || "high",
      healthData,
      emergencyType: emergencyType || "general",
      radius: 300,
      status: "active",
    });

    // Determine which specializations to prioritize based on emergency type/description
    const getPreferredSpecializations = (description: string, emergencyType?: string) => {
      const desc = description.toLowerCase();
      const type = emergencyType?.toLowerCase() || "";
      
      if (desc.includes("cardiac") || desc.includes("heart") || desc.includes("chest pain") || type === "cardiac") {
        return { preferred: ["cardiology", "cardiac", "emergency medicine"], priority: "critical" };
      }
      if (desc.includes("stroke") || desc.includes("brain") || desc.includes("neurological") || type === "neurological") {
        return { preferred: ["neurology", "emergency medicine"], priority: "critical" };
      }
      if (desc.includes("trauma") || desc.includes("accident") || desc.includes("injury") || type === "trauma") {
        return { preferred: ["trauma", "surgery", "orthopedics", "emergency medicine"], priority: "high" };
      }
      if (desc.includes("respiratory") || desc.includes("breathing") || desc.includes("lung") || type === "respiratory") {
        return { preferred: ["pulmonology", "emergency medicine"], priority: "high" };
      }
      if (desc.includes("pediatric") || desc.includes("child") || desc.includes("baby") || type === "pediatric") {
        return { preferred: ["pediatrics", "emergency medicine"], priority: "high" };
      }
      if (desc.includes("psychiatric") || desc.includes("mental") || desc.includes("suicide") || type === "psychiatric") {
        return { preferred: ["psychiatry", "emergency medicine"], priority: "medium" };
      }
      
      return { preferred: ["emergency medicine", "general medicine"], priority: severity === "critical" ? "critical" : "medium" };
    };

    const { preferred: preferredSpecs, priority } = getPreferredSpecializations(description, emergencyType);
    
    // Find specialized doctors first (within 5km for specialists, 8km for general)
    const specialistRadius = 5000; // 5km for specialists
    const generalRadius = 8000; // 8km for general practitioners

    let nearbyDoctors: any[] = [];

    // First, try to find specialists within closer radius
    if (preferredSpecs.length > 0) {
      const specialists = await User.find({
        role: { $in: ["doctor", "specialist", "paramedic"] },
        availableForEmergency: true,
        specialization: { $regex: preferredSpecs.join("|"), $options: "i" },
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
            $maxDistance: specialistRadius,
          },
        },
      }).select("_id name phone specialization role distance").lean();
      
      nearbyDoctors = [...specialists];
    }

    // If no specialists found or for general emergencies, find all available doctors within larger radius
    if (nearbyDoctors.length < 3 || preferredSpecs.includes("general medicine")) {
      const generalDoctors = await User.find({
        role: { $in: ["doctor", "paramedic", "nurse"] },
        availableForEmergency: true,
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
            $maxDistance: generalRadius,
          },
        },
      }).select("_id name phone specialization role").lean();

      // Add general doctors that aren't already included
      const existingIds = nearbyDoctors.map(d => d._id.toString());
      const newDoctors = generalDoctors.filter(d => !existingIds.includes((d as any)._id.toString()));
      nearbyDoctors = [...nearbyDoctors, ...newDoctors];
    }

    // Sort by specialization match and limit to 10 doctors max
    nearbyDoctors = nearbyDoctors
      .sort((a, b) => {
        const aMatch = preferredSpecs.some(spec => 
          a.specialization?.toLowerCase().includes(spec.toLowerCase())
        );
        const bMatch = preferredSpecs.some(spec => 
          b.specialization?.toLowerCase().includes(spec.toLowerCase())
        );
        
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      })
      .slice(0, 10);

    const doctorIds = nearbyDoctors.map((d: any) => d._id);

    // Update emergency with notified doctors
    await Emergency.findByIdAndUpdate(emergency._id, {
      notifiedDoctors: doctorIds,
      preferredSpecializations: preferredSpecs,
      matchedSpecialists: nearbyDoctors.filter(d => 
        preferredSpecs.some(spec => 
          d.specialization?.toLowerCase().includes(spec.toLowerCase())
        )
      ).length,
    });

    // Create emergency chat
    const chat = await Chat.create({
      type: "emergency",
      name: `Emergency: ${description.substring(0, 30)}...`,
      participants: [reportedBy, ...doctorIds],
      participantNames: [reporterName, ...nearbyDoctors.map((d: any) => d.name)],
      emergencyId: emergency._id,
      isActive: true,
    });

    await Emergency.findByIdAndUpdate(emergency._id, { chatId: chat._id });

    // Notify doctors via Pusher with priority-based messaging
    if (pusher && nearbyDoctors.length > 0) {
      const priorityMessage = priority === "critical" ? "🚨 CRITICAL EMERGENCY" : 
                             priority === "high" ? "⚠️ HIGH PRIORITY EMERGENCY" : "📢 Emergency Alert";
      
      for (const doctor of nearbyDoctors) {
        try {
          const isSpecialist = preferredSpecs.some(spec => 
            doctor.specialization?.toLowerCase().includes(spec.toLowerCase())
          );
          
          await pusher.trigger(`user-${doctor._id}`, "emergency-alert", {
            emergency: emergency.toObject(),
            chat: chat.toObject(),
            message: `${priorityMessage}${isSpecialist ? " (Your Specialty)" : ""}\n${description}\n📍 ${address || "Location shared"}`,
            priority: priority,
            isSpecialtyMatch: isSpecialist,
            preferredSpecs: preferredSpecs,
          });
        } catch (e) {
          console.log("Push notification failed for doctor:", doctor._id);
        }
      }
      
      // Also send notification to patient
      try {
        await pusher.trigger(`user-${reportedBy}`, "emergency-created", {
          emergency: emergency.toObject(),
          chat: chat.toObject(),
          message: `Emergency alert sent to ${nearbyDoctors.length} nearby medical professionals`,
          specialistsNotified: nearbyDoctors.filter(d => 
            preferredSpecs.some(spec => 
              d.specialization?.toLowerCase().includes(spec.toLowerCase())
            )
          ).length,
        });
      } catch (e) {
        console.log("Push notification failed for patient:", reportedBy);
      }
    }

    return NextResponse.json({
      emergency: { ...emergency.toObject(), chatId: chat._id },
      chat,
      notifiedDoctors: nearbyDoctors.length,
      doctors: nearbyDoctors,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE emergency (respond, resolve, escalate radius)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { emergencyId, action, doctorId } = body;

    if (!emergencyId) {
      return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    }

    if (action === "respond" && doctorId) {
      // Doctor responds to emergency
      await Emergency.findByIdAndUpdate(emergencyId, {
        $addToSet: { respondedDoctors: doctorId },
        status: "responded",
      });

      if (pusher) {
        await pusher.trigger(`emergency-${emergencyId}`, "doctor-responded", { doctorId });
      }
    } else if (action === "resolve") {
      await Emergency.findByIdAndUpdate(emergencyId, {
        status: "resolved",
        resolvedAt: new Date(),
      });
    } else if (action === "escalate") {
      // Escalate radius: 300 -> 400 -> 600 -> 1000 -> 2000 -> 8000
      const radiusSteps = [300, 400, 600, 1000, 2000, 8000];
      const currentIdx = radiusSteps.indexOf(emergency.radius);
      const newRadius = currentIdx < radiusSteps.length - 1 ? radiusSteps[currentIdx + 1] : 8000;

      // Find additional doctors in expanded radius
      const [lng, lat] = emergency.location.coordinates;
      const additionalDoctors = await User.find({
        _id: { $nin: emergency.notifiedDoctors },
        role: { $in: ["doctor", "paramedic", "nurse"] },
        availableForEmergency: true,
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: newRadius,
          },
        },
      }).select("_id name").lean();

      const newDoctorIds = additionalDoctors.map((d: any) => d._id);

      await Emergency.findByIdAndUpdate(emergencyId, {
        radius: newRadius,
        $addToSet: { notifiedDoctors: { $each: newDoctorIds } },
      });

      // Notify new doctors
      if (pusher) {
        for (const doc of additionalDoctors) {
          await pusher.trigger(`user-${doc._id}`, "emergency-alert", {
            emergency: emergency.toObject(),
          });
        }
      }

      return NextResponse.json({ newRadius, additionalDoctorsNotified: additionalDoctors.length });
    } else if (action === "cancel") {
      await Emergency.findByIdAndUpdate(emergencyId, { status: "cancelled" });
    }

    const updated = await Emergency.findById(emergencyId).lean();
    return NextResponse.json({ emergency: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
