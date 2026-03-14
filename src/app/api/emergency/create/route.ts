import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Emergency from "@/models/Emergency";
import { activeEmergencies } from "@/lib/emergencyStorage";

export async function POST(request: NextRequest) {
  try {
    console.log('Emergency creation request received');
    await dbConnect();
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { patientId, patientName, location, message, timestamp } = body;

    // Validate required fields
    if (!patientId) {
      console.error('Missing patientId in request');
      return NextResponse.json({ error: 'Patient ID is required for SOS requests' }, { status: 400 });
    }

    if (patientId === 'emergency-access') {
      console.error('Emergency access not allowed for SOS');
      return NextResponse.json({ error: 'Please log in to request emergency assistance' }, { status: 400 });
    }

    if (!location) {
      console.error('Missing location in request');
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    console.log('Looking up user with ID:', patientId);
    
    // Get patient info from User model
    const patient = await User.findById(patientId);
    if (!patient) {
      console.error('User not found for ID:', patientId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', {
      id: patient._id,
      name: patient.name,
      phone: patient.phone,
      role: patient.role
    });

    // Validate location data
    if (!location.lat || !location.lng) {
      console.error('Invalid location data:', location);
      return NextResponse.json({ error: 'Valid latitude and longitude required' }, { status: 400 });
    }

    console.log('Creating emergency with location:', location);

    // Create emergency request in MongoDB using logged-in user's data
    const emergencyData = {
      reportedBy: patient._id,
      userId: patient._id, // Add userId field for consistency
      reporterName: patient.name,
      reporterPhone: patient.phone || 'Not provided',
      patientName: patient.name, // Add patientName field
      phoneNumber: patient.phone || 'Not provided', // Add phoneNumber field
      age: patient.age, // Add age field
      bloodGroup: patient.bloodGroup, // Add bloodGroup field
      allergies: patient.allergies || [], // Add allergies field
      medicalConditions: patient.medicalConditions || [], // Add medicalConditions field
      latitude: location.lat, // Add latitude for backward compatibility
      longitude: location.lng, // Add longitude for backward compatibility
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat] // MongoDB uses [lng, lat] format
      },
      address: location.address || 'Live location shared',
      description: message || 'Emergency assistance needed',
      severity: 'high',
      status: 'active',
      healthData: {
        bloodGroup: patient.bloodGroup || '',
        allergies: patient.allergies || [],
        conditions: []
      },
      radius: 5000 // 5km in meters
    };

    console.log('Creating emergency with user data:', emergencyData);

    const emergency = new Emergency(emergencyData);
    const savedEmergency = await emergency.save();
    
    console.log('Emergency saved successfully:', {
      emergencyId: savedEmergency._id,
      reporterName: savedEmergency.reporterName,
      reporterPhone: savedEmergency.reporterPhone,
      location: savedEmergency.location.coordinates
    });
    
    // Also store in shared Map for real-time notifications
    const emergencyForMap = {
      id: savedEmergency._id.toString(),
      patientId: patient._id.toString(),
      patientName: patient.name,
      location,
      message: message || 'Emergency assistance needed',
      timestamp: timestamp || savedEmergency.createdAt.toISOString(),
      status: 'active',
      notifiedDoctors: [],
      respondingDoctors: [],
      acceptedDoctor: null,
      createdAt: savedEmergency.createdAt
    };
    
    activeEmergencies.set(savedEmergency._id.toString(), emergencyForMap);
    
    console.log('Emergency stored in Map for real-time notifications:', {
      mapId: savedEmergency._id.toString(),
      patientName: patient.name,
      totalEmergenciesInMap: activeEmergencies.size
    });

    // For demo purposes, simulate finding nearby doctors
    // In production, you would query your doctors collection with geolocation
    const nearbyDoctors = await User.find({ 
      role: 'doctor',
      $or: [
        { isOnline: true },
        { isOnline: { $exists: false } }
      ]
    }).limit(5);

console.log(`Found ${nearbyDoctors.length} potential doctors to notify`);

      return NextResponse.json({
        success: true,
        emergencyId: savedEmergency._id,
        message: 'Emergency request created successfully',
        emergency: {
          id: savedEmergency._id,
          status: savedEmergency.status,
          reporterName: savedEmergency.reporterName,
          description: savedEmergency.description,
          location: savedEmergency.location,
          createdAt: savedEmergency.createdAt
        },
        notifiedDoctors: nearbyDoctors.length,
      nearbyDoctors: nearbyDoctors.map(doc => ({
        id: doc._id,
        name: doc.name,
        specialization: doc.specialization || 'General Practice'
      }))
    });

  } catch (error) {
    console.error('Emergency creation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Specific error handling for different types of errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Invalid emergency data',
        details: error.message,
        validationErrors: error.errors
      }, { status: 400 });
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid user ID format',
        details: 'Please ensure you are logged in properly'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to create emergency request',
      details: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}