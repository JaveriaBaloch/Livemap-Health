import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Emergency from '@/models/Emergency';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get the specific emergency ID from query params
    const { searchParams } = new URL(request.url);
    const emergencyId = searchParams.get('emergencyId');

    if (emergencyId) {
      // Query specific emergency
      const emergency = await Emergency.findById(emergencyId);
      console.log('Direct database query for emergency:', emergencyId);
      console.log('Result:', {
        found: !!emergency,
        id: emergency?._id,
        status: emergency?.status,
        acceptedBy: emergency?.acceptedBy,
        acceptedAt: emergency?.acceptedAt,
        reporterName: emergency?.reporterName
      });

      return NextResponse.json({
        found: !!emergency,
        emergency: emergency ? {
          id: emergency._id.toString(),
          status: emergency.status,
          acceptedBy: emergency.acceptedBy?.toString(),
          acceptedAt: emergency.acceptedAt,
          reporterName: emergency.reporterName,
          description: emergency.description
        } : null
      });
    }

    // Query all emergencies if no specific ID
    const allEmergencies = await Emergency.find({}).limit(10);
    
    console.log('All emergencies in database:');
    allEmergencies.forEach((emergency, index) => {
      console.log(`${index + 1}:`, {
        id: emergency._id.toString(),
        status: emergency.status,
        acceptedBy: emergency.acceptedBy?.toString() || 'undefined',
        acceptedAt: emergency.acceptedAt || 'undefined',
        reporterName: emergency.reporterName
      });
    });

    return NextResponse.json({
      count: allEmergencies.length,
      emergencies: allEmergencies.map(e => ({
        id: e._id.toString(),
        status: e.status,
        acceptedBy: e.acceptedBy?.toString() || null,
        acceptedAt: e.acceptedAt || null,
        reporterName: e.reporterName
      }))
    });

  } catch (error: any) {
    console.error('Database verification error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}