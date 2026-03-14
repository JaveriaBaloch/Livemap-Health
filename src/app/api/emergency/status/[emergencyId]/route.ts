import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";

const getDoctorLatLng = (doctor: any) => {
  const coords = doctor?.location?.coordinates;
  if (!coords || coords.length < 2) {
    return { lat: undefined, lng: undefined };
  }

  return {
    lat: coords[1],
    lng: coords[0],
  };
};

const mapDoctor = (doctor: any, status: 'responding' | 'accepted') => {
  const { lat, lng } = getDoctorLatLng(doctor);

  return {
    notificationId: `${doctor?._id || 'doctor'}-${status}`,
    doctorId: doctor?._id?.toString(),
    doctorName: doctor?.name || 'Doctor',
    specialization: doctor?.specialization || 'General Practice',
    phone: doctor?.phone,
    rating: doctor?.rating || 0,
    status,
    estimatedArrival: status === 'accepted' ? '5-10 minutes' : 'Pending',
    location: {
      lat,
      lng,
    },
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { emergencyId: string } }
) {
  try {
    await dbConnect();
    const { emergencyId } = params;

    const emergency = await Emergency.findById(emergencyId)
      .populate('acceptedBy', 'name specialization phone rating location')
      .populate('respondedDoctors', 'name specialization phone rating location')
      .populate('reportedBy', 'name phone');

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const acceptedDoctor = emergency.acceptedBy
      ? mapDoctor(emergency.acceptedBy, 'accepted')
      : null;

    const acceptedDoctorId = emergency.acceptedBy?._id?.toString();

    const respondingDoctors = (emergency.respondedDoctors || [])
      .filter((doctor: any) => doctor?._id?.toString() !== acceptedDoctorId)
      .map((doctor: any) => mapDoctor(doctor, 'responding'));

    if (acceptedDoctor) {
      respondingDoctors.unshift(acceptedDoctor);
    }

    return NextResponse.json({
      success: true,
      emergency: {
        id: emergency._id.toString(),
        status: emergency.status,
        acceptedAt: emergency.acceptedAt,
        createdAt: emergency.createdAt,
      },
      acceptedDoctor,
      respondingDoctors,
      totalNotified: respondingDoctors.length,
    });
  } catch (error) {
    console.error('Emergency status error:', error);
    return NextResponse.json({
      error: 'Failed to get emergency status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { emergencyId: string } }
) {
  try {
    await dbConnect();
    const { emergencyId } = params;
    const { action } = await request.json();

    if (action === 'cancel') {
      await Emergency.findByIdAndUpdate(emergencyId, {
        $set: {
          status: 'cancelled',
          acceptedBy: null,
          acceptedAt: null,
        },
      });

      return NextResponse.json({ success: true, message: 'Emergency cancelled' });
    }

    return NextResponse.json({ success: true, message: 'Action processed' });
  } catch (error) {
    console.error('Emergency action error:', error);
    return NextResponse.json({
      error: 'Failed to process emergency action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}