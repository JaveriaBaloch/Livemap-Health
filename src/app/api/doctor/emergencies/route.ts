import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Emergency from "@/models/Emergency";
import { activeEmergencies } from "@/lib/emergencyStorage";

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

    // Get doctor info
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Invalid doctor' }, { status: 404 });
    }

    // Persist doctor's current live location from client polling
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
      // MongoDB coordinates are [lng, lat], but we need [lat, lng] for distance calc
      const emergencyLat = emergency.location.coordinates[1];
      const emergencyLng = emergency.location.coordinates[0];
      
      const distance = calculateDistance(lat, lng, emergencyLat, emergencyLng);
      
      console.log('Emergency distance calculation:', {
        emergencyId: emergency._id,
        doctorCoords: [lat, lng],
        emergencyCoords: [emergencyLat, emergencyLng],
        calculatedDistance: distance
      });

      return {
        id: emergency._id.toString(),
        patientId: emergency.reportedBy?.toString() || 'anonymous',
        patientName: emergency.reporterName,
        location: {
          lat: emergencyLat,
          lng: emergencyLng,
          address: emergency.address
        },
        description: emergency.description,
        message: emergency.description, // for backward compatibility
        timestamp: emergency.createdAt.toISOString(),
        createdAt: emergency.createdAt,
        status: emergency.status,
        distance: distance,
        formatted_distance: `${distance.toFixed(1)} km`,
        severity: emergency.severity,
        healthData: emergency.healthData
      };
    });

    console.log(`Found ${nearbyEmergencies.length} active emergencies within 5km for doctor ${doctor.name}`);

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

  } catch (error) {
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
    
    console.log('🔥 POST request received for emergency acceptance');
    
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('🔥 Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { doctorId, emergencyId, action, doctorLocation } = requestBody;

    console.log('🔥 Doctor emergency response:', {
      doctorId,
      emergencyId,
      action,
      doctorIdType: typeof doctorId,
      emergencyIdType: typeof emergencyId
    });
    
    if (!doctor || doctor.role !== 'doctor') {
      console.error('❌ Invalid doctor:', { found: !!doctor, role: doctor?.role });
      return NextResponse.json({ error: 'Invalid doctor' }, { status: 404 });
    }

    // Update doctor's latest location (if provided) to keep patient tracking accurate
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
    console.log('🔥 Looking up emergency with ID:', emergencyId);
    const emergency = await Emergency.findById(emergencyId);
    console.log('🔥 Emergency found:', {
      found: !!emergency,
      id: emergency?._id?.toString(),
      status: emergency?.status,
      reporterName: emergency?.reporterName
    });
    
    if (!emergency) {
      console.error('❌ Emergency not found in MongoDB:', emergencyId);
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    if (emergency.status !== 'active') {
      console.error('❌ Emergency is not active, current status:', emergency.status);
      return NextResponse.json({ error: 'Emergency is no longer active' }, { status: 400 });
    }

    if (action === 'accept') {
      console.log(`Doctor ${doctor.name} accepting emergency ${emergencyId}`);
      console.log('Doctor ObjectId:', doctor._id);
      console.log('Doctor ObjectId type:', typeof doctor._id);

      try {
        // First, find the emergency to make sure it exists
        const existingEmergency = await Emergency.findById(emergencyId);
        if (!existingEmergency) {
          console.error('Emergency not found before update:', emergencyId);
          return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
        }

        // Use findByIdAndUpdate with explicit field setting
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

        // Double check by querying again with raw result
        const verifyEmergency = await Emergency.findById(emergencyId).lean();
        if (!verifyEmergency?.acceptedBy) {
          return NextResponse.json({ error: 'Failed to persist emergency acceptance' }, { status: 500 });
        }

        const updatedEmergency = updateResult;

        // Populate the reportedBy field for response
        await updatedEmergency.populate('reportedBy', 'name phone bloodGroup allergies medicalConditions age');

      } catch (updateError) {
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
          specialization: doctor.specialization || 'General Practice',
          phone: doctor.phone,
          estimatedArrival: '5-10 minutes'
        };
        activeEmergencies.set(emergencyId, mapEmergency);
      }

      console.log(`Emergency ${emergencyId} accepted by Dr. ${doctor.name}`);

      return NextResponse.json({
        success: true,
        message: 'Emergency accepted successfully',
        emergency: {
          id: emergencyId,
          status: 'accepted',
          acceptedDoctor: {
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization || 'General Practice',
            phone: doctor.phone,
            estimatedArrival: '5-10 minutes'
          }
        }
      });
    }

    if (action === 'decline') {
      console.log(`Doctor ${doctor.name} declined emergency ${emergencyId}`);
      return NextResponse.json({
        success: true,
        message: 'Emergency declined'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Doctor response error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return NextResponse.json({ 
      error: 'Failed to process doctor response',
      details: error.message || 'Unknown error',
      errorType: error.name || 'UnknownError'
    }, { status: 500 });
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}