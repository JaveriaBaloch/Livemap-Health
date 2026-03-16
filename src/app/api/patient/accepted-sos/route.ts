import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Emergency from '@/models/Emergency';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const emergencies = await Emergency.find({
      reportedBy: patientId,
      acceptedBy: { $exists: true, $ne: null },
      status: { $in: ['responded', 'in-progress', 'en-route', 'arrived', 'resolved'] }
    })
      .populate('acceptedBy', 'name specialization phone location')
      .sort({ acceptedAt: -1 })
      .limit(20);

    const formatted = emergencies.map((emergency: any) => {
      const doctor = emergency.acceptedBy;
      const doctorCoords = doctor?.location?.coordinates;

      return {
        id: emergency._id.toString(),
        description: emergency.description,
        status: emergency.status,
        acceptedAt: emergency.acceptedAt,
        estimatedArrival: '5-10 minutes',
        doctor: doctor
          ? {
              id: doctor._id.toString(),
              name: doctor.name,
              specialization: doctor.specialization || 'General Practice',
              phone: doctor.phone,
              location: doctorCoords && doctorCoords.length >= 2
                ? { lat: doctorCoords[1], lng: doctorCoords[0] }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      emergencies: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error('Patient accepted SOS fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch accepted SOS requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
