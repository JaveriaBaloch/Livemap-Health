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
      // Debug: Check if there are any emergencies with acceptedBy field
      console.log('API: Querying all emergencies for debugging...');
      const allEmergencies = await Emergency.find({}).select('_id acceptedBy status reporterName').limit(5);
      console.log('API: Sample emergencies in DB:', allEmergencies.map(e => ({
        id: e._id.toString(),
        acceptedBy: e.acceptedBy?.toString(),
        status: e.status,
        reporterName: e.reporterName
      })));

      // Find emergencies where this doctor has accepted the case
      // Using status 'responded' with acceptedBy field since 'accepted' status causes validation errors
      console.log('API: Searching for emergencies accepted by doctor:', doctorId);
      console.log('API: Doctor ID type:', typeof doctorId);
      
      // Convert string doctorId to ObjectId for proper matching
      const doctorObjectId = new Types.ObjectId(doctorId);
      console.log('API: Doctor ObjectId:', doctorObjectId);
      
      // First, let's see all emergencies with acceptedBy field set (regardless of doctor)
      const allAcceptedEmergencies = await Emergency.find({
        acceptedBy: { $exists: true, $ne: null }
      }).select('_id acceptedBy status reporterName acceptedAt').limit(10);
      
      console.log('API: All emergencies with acceptedBy field:', allAcceptedEmergencies.map(e => ({
        id: e._id.toString(),
        acceptedBy: e.acceptedBy?.toString(),
        status: e.status,
        reporterName: e.reporterName,
        acceptedAt: e.acceptedAt
      })));
      
      // Now let's try different query approaches with ObjectId
      const query1 = await Emergency.find({
        acceptedBy: doctorObjectId,
        status: { $in: ['responded', 'resolved', 'in-progress', 'en-route', 'arrived'] }
      }).limit(5);
      
      const query2 = await Emergency.find({
        acceptedBy: doctorObjectId
      }).limit(5);
      
      const query3 = await Emergency.find({
        status: 'responded'
      }).limit(5);
      
      // Also try string comparison
      const queryString = await Emergency.find({
        acceptedBy: doctorId
      }).limit(5);
      
      console.log('API: Query1 (ObjectId acceptedBy + status):', query1.length, 'results');
      console.log('API: Query2 (ObjectId acceptedBy only):', query2.length, 'results');
      console.log('API: Query3 (responded status only):', query3.length, 'results');
      console.log('API: QueryString (string acceptedBy):', queryString.length, 'results');
      
      const acceptedEmergencies = await Emergency.find({
        acceptedBy: doctorObjectId,
        status: { $in: ['responded', 'resolved', 'in-progress', 'en-route', 'arrived'] }
      })
      .populate('userId', 'name phone bloodGroup allergies medicalConditions age')
      .populate('reportedBy', 'name phone bloodGroup allergies medicalConditions age')
      .sort({ acceptedAt: -1 }) // Most recently accepted first
      .limit(20); // Limit to prevent huge responses

      console.log('API: Found accepted emergencies:', acceptedEmergencies.length);

      console.log('API: Found accepted emergencies:', acceptedEmergencies.length);

      // Format the emergencies for the frontend
      const formattedEmergencies = acceptedEmergencies.map((emergency, index) => {
        try {
          // Use populated userId first, then reportedBy, then stored fields
          const patientData = emergency.userId || emergency.reportedBy;
          console.log(`API: Processing emergency ${index + 1}:`, {
            id: emergency._id?.toString(),
            patientData: patientData ? {
              name: patientData.name,
              phone: patientData.phone
            } : 'No patient data',
            storedPatientName: emergency.patientName,
            storedReporterName: emergency.reporterName
          });
          
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

      console.log('API: Successfully formatted emergencies:', formattedEmergencies.length);

      return NextResponse.json({
        success: true,
        emergencies: formattedEmergencies,
        count: formattedEmergencies.length
      });

    } catch (dbError) {
      console.error('API: Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database query failed', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
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