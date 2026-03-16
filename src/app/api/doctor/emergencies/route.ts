import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Emergency from "@/models/Emergency";
import Notification from "@/models/Notification";
import { activeEmergencies } from "@/lib/emergencyStorage";

const MEDICAL_ROLES = ["doctor", "nurse", "paramedic"];

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID required' }, { status: 400 });
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Doctor current location required' }, { status: 400 });
    }

    // Get medical staff info (doctor, nurse, or paramedic)
    const doctor = await User.findById(doctorId);
    if (!doctor || !MEDICAL_ROLES.includes(doctor.role)) {
      return NextResponse.json({ error: 'Invalid medical staff' }, { status: 404 });
    }

    // Persist current live location from client polling
    await User.findByIdAndUpdate(doctorId, {
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      isOnline: true,
      lastLocationUpdate: new Date(),
    });

    // Get all active emergencies from MongoDB within 5km radius
    const emergencies = await Emergency.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // MongoDB uses [lng, lat]
          },
          $maxDistance: 5000 // 5km in meters
        }
      }
    }).sort({ createdAt: -1 });

    // Populate patient data from User references
    await Emergency.populate(emergencies, [
      { path: 'reportedBy', select: 'name phone bloodGroup allergies medicalConditions age' },
      { path: 'userId', select: 'name phone bloodGroup allergies medicalConditions age' },
    ]);

    console.log('MongoDB emergency query result:', {
      doctorLocation: { lat, lng },
      totalActiveEmergencies: emergencies.length,
      emergencies: emergencies.map(e => ({
        id: e._id,
        reporterName: e.reporterName,
        coordinates: e.location.coordinates,
        status: e.status,
        createdAt: e.createdAt
      }))
    });

    // Calculate actual distances and format for frontend
    const nearbyEmergencies = emergencies.map(emergency => {
      const emergencyLat = emergency.location.coordinates[1];
      const emergencyLng = emergency.location.coordinates[0];
      const distance = calculateDistance(lat, lng, emergencyLat, emergencyLng);

      // Use populated user data as fallback for missing fields
      const patient: any = emergency.userId || emergency.reportedBy;
      const pd = patient && typeof patient === 'object' && patient.name ? patient : null;

      return {
        id: emergency._id.toString(),
        patientId: pd?._id?.toString() || emergency.reportedBy?.toString() || emergency.userId?.toString() || 'anonymous',
        patientName: emergency.reporterName || emergency.patientName || pd?.name || 'Unknown',
        reporterPhone: emergency.reporterPhone,
        phoneNumber: emergency.phoneNumber || emergency.reporterPhone || pd?.phone,
        age: emergency.age || pd?.age,
        bloodGroup: emergency.bloodGroup || emergency.healthData?.bloodGroup || pd?.bloodGroup,
        allergies: emergency.allergies?.length ? emergency.allergies : (pd?.allergies || emergency.healthData?.allergies || []),
        medicalConditions: emergency.medicalConditions?.length ? emergency.medicalConditions : (pd?.medicalConditions || emergency.healthData?.conditions || []),
        latitude: emergencyLat,
        longitude: emergencyLng,
        address: emergency.address,
        description: emergency.description,
        message: emergency.description,
        timestamp: emergency.createdAt.toISOString(),
        createdAt: emergency.createdAt,
        status: emergency.status,
        distance: distance,
        formatted_distance: `${distance.toFixed(1)} km`,
        severity: emergency.severity,
      };
    });

    console.log(`Found ${nearbyEmergencies.length} active emergencies within 5km for ${doctor.role} ${doctor.name}`);

    return NextResponse.json({
      success: true,
      emergencies: nearbyEmergencies,
      doctorLocation: { lat, lng },
      totalFound: nearbyEmergencies.length,
      queryInfo: {
        searchRadius: '5km',
        mongoQuery: 'location $near with $maxDistance 5000m'
      }
    });

  } catch (error: any) {
    console.error('Doctor notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to get emergency notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    console.log('POST request received for emergency acceptance');
    
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { doctorId, emergencyId, action, doctorLocation } = requestBody;

    console.log('Medical staff emergency response:', {
      doctorId,
      emergencyId,
      action,
      doctorIdType: typeof doctorId,
      emergencyIdType: typeof emergencyId
    });

    if (!doctorId || !emergencyId || !action) {
      return NextResponse.json({ error: 'doctorId, emergencyId, and action are required' }, { status: 400 });
    }

    // FIX: This line was MISSING in the original — doctor was used below without being defined
    const doctor = await User.findById(doctorId);
    if (!doctor || !MEDICAL_ROLES.includes(doctor.role)) {
      console.error('Invalid medical staff:', { found: !!doctor, role: doctor?.role });
      return NextResponse.json({ error: 'Invalid medical staff' }, { status: 404 });
    }

    // Update latest location if provided to keep patient tracking accurate
    if (doctorLocation?.lat && doctorLocation?.lng) {
      await User.findByIdAndUpdate(doctorId, {
        location: {
          type: 'Point',
          coordinates: [doctorLocation.lng, doctorLocation.lat],
        },
        isOnline: true,
        lastLocationUpdate: new Date(),
      });
    }

    // Get emergency from MongoDB
    console.log('Looking up emergency with ID:', emergencyId);
    const emergency = await Emergency.findById(emergencyId);
    console.log('Emergency found:', {
      found: !!emergency,
      id: emergency?._id?.toString(),
      status: emergency?.status,
      reporterName: emergency?.reporterName
    });
    
    if (!emergency) {
      console.error('Emergency not found in MongoDB:', emergencyId);
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    if (emergency.status !== 'active') {
      console.error('Emergency is not active, current status:', emergency.status);
      return NextResponse.json({ error: 'Emergency is no longer active' }, { status: 400 });
    }

    if (action === 'accept') {
      console.log(`${doctor.role} ${doctor.name} accepting emergency ${emergencyId}`);

      try {
        const existingEmergency = await Emergency.findById(emergencyId);
        if (!existingEmergency) {
          console.error('Emergency not found before update:', emergencyId);
          return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
        }

        const updateData = {
          status: 'accepted',
          acceptedBy: doctor._id,
          acceptedAt: new Date(),
          $addToSet: {
            respondedDoctors: doctor._id
          }
        };

        const updateResult = await Emergency.findByIdAndUpdate(
          emergencyId,
          updateData,
          { 
            new: true,
            runValidators: true,
            useFindAndModify: false
          }
        );

        if (!updateResult) {
          return NextResponse.json({ error: 'Failed to update emergency' }, { status: 500 });
        }

        // Verify persistence
        const verifyEmergency: any = await Emergency.findById(emergencyId).lean();
        if (!verifyEmergency?.acceptedBy) {
          return NextResponse.json({ error: 'Failed to persist emergency acceptance' }, { status: 500 });
        }

        // Populate the reportedBy field for response
        await updateResult.populate('reportedBy', 'name phone bloodGroup allergies medicalConditions age');

      } catch (updateError: any) {
        return NextResponse.json({ 
          error: 'Failed to update emergency', 
          details: updateError.message,
          errorType: updateError.name
        }, { status: 500 });
      }

      // Also update the in-memory Map if it exists
      const mapEmergency = activeEmergencies.get(emergencyId);
      if (mapEmergency) {
        mapEmergency.status = 'accepted';
        mapEmergency.acceptedDoctor = {
          id: doctor._id.toString(),
          doctorName: doctor.name,
          specialization: doctor.specialization || doctor.role,
          phone: doctor.phone,
          estimatedArrival: '5-10 minutes'
        };
        activeEmergencies.set(emergencyId, mapEmergency);
      }

      console.log(`Emergency ${emergencyId} accepted by ${doctor.role} ${doctor.name}`);

      // Create notification for patient
      const patientId = emergency.reportedBy?.toString() || emergency.userId?.toString();
      if (patientId) {
        try {
          await Notification.create({
            userId: patientId,
            type: "status",
            title: `Dr. ${doctor.name}`,
            message: `Dr. ${doctor.name} accepted your emergency and is preparing to help`,
            icon: "✅",
            color: "#10b981",
            emergencyId,
            fromUserId: doctor._id,
            fromUserName: doctor.name,
            status: "accepted",
            read: false,
          });
        } catch (e) { console.error("Notification create failed:", e); }
      }

      return NextResponse.json({
        success: true,
        message: 'Emergency accepted successfully',
        emergency: {
          id: emergencyId,
          status: 'accepted',
          acceptedDoctor: {
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization || doctor.role,
            phone: doctor.phone,
            estimatedArrival: '5-10 minutes'
          }
        }
      });
    }

    if (action === 'decline') {
      console.log(`${doctor.role} ${doctor.name} declined emergency ${emergencyId}`);
      return NextResponse.json({
        success: true,
        message: 'Emergency declined'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Doctor response error:', error);
    return NextResponse.json({ 
      error: 'Failed to process response',
      details: error.message || 'Unknown error',
      errorType: error.name || 'UnknownError'
    }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}