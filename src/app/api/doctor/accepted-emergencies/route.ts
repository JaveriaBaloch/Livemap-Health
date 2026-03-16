import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Emergency from '@/models/Emergency';
import User from '@/models/User';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting accepted emergencies request');
    await dbConnect();
    console.log('API: Database connected successfully');

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      console.error('API: No doctor ID provided');
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching accepted emergencies for doctor:', doctorId);

    // Validate that doctorId is a valid MongoDB ObjectId
    if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('API: Invalid doctor ID format:', doctorId);
      return NextResponse.json(
        { error: 'Invalid doctor ID format' },
        { status: 400 }
      );
    }

    try {
      // Convert string doctorId to ObjectId for proper matching
      const doctorObjectId = new Types.ObjectId(doctorId);
      console.log('API: Doctor ObjectId:', doctorObjectId);

      // Find emergencies where this doctor has accepted/responded (either field)
      const acceptedEmergencies = await Emergency.find({
        status: { $in: ['responded', 'accepted'] },
        $or: [
          { acceptedBy: doctorObjectId },
          { respondedDoctors: doctorObjectId }
        ]
      })
        .populate('userId', 'name phone bloodGroup allergies medicalConditions age')
        .populate('reportedBy', 'name phone bloodGroup allergies medicalConditions age')
        .sort({ acceptedAt: -1 }) // Most recently accepted first
        .limit(20); // Limit to prevent huge responses

      if (!acceptedEmergencies.length) {
        console.warn('API: No accepted emergencies found for doctor:', doctorId);
      }

      // Format the emergencies for the frontend
      const formattedEmergencies = acceptedEmergencies.map((emergency, index) => {
        try {
          // Use populated userId first, then reportedBy, then stored fields
          const patientData = emergency.userId || emergency.reportedBy;
          return {
            id: emergency._id.toString(),
            patientId: (emergency.userId as any)?._id?.toString() || (emergency.reportedBy as any)?._id?.toString() || emergency.userId?.toString() || emergency.reportedBy?.toString(),
            patientName: patientData?.name || emergency.patientName || emergency.reporterName || 'Unknown Patient',
            phoneNumber: patientData?.phone || emergency.phoneNumber || emergency.reporterPhone,
            age: patientData?.age || emergency.age,
            bloodGroup: patientData?.bloodGroup || emergency.bloodGroup || emergency.healthData?.bloodGroup,
            allergies: patientData?.allergies || emergency.allergies || emergency.healthData?.allergies || [],
            medicalConditions: patientData?.medicalConditions || emergency.medicalConditions || emergency.healthData?.conditions || [],
            latitude: emergency.location?.coordinates?.[1] || emergency.latitude,
            longitude: emergency.location?.coordinates?.[0] || emergency.longitude,
            description: emergency.description,
            status: emergency.status,
            createdAt: emergency.createdAt,
            acceptedAt: emergency.acceptedAt,
            urgencyLevel: emergency.urgencyLevel || 'medium'
          };
        } catch (formatError) {
          console.error('API: Error formatting emergency:', emergency._id, formatError);
          return null;
        }
      }).filter(Boolean); // Remove any null entries

      return NextResponse.json({
        success: true,
        emergencies: formattedEmergencies,
        count: formattedEmergencies.length
      });

    } catch (dbError: any) {
      console.error('API: Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database query failed', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API: Accepted emergencies error:', error);
    console.error('API: Error stack:', error.stack);
    
    // Return more specific error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorType = error.name || 'UnknownError';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch accepted emergencies',
        details: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}