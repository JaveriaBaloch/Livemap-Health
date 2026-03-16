import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import { activeEmergencies } from "@/lib/emergencyStorage";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get emergencies from MongoDB
    const mongoEmergencies = await Emergency.find({}).sort({ createdAt: -1 });
    const activeMongoEmergencies = await Emergency.find({ status: 'active' }).sort({ createdAt: -1 });
    
    // Get emergencies from in-memory Map
    const mapEmergencies = Array.from(activeEmergencies.entries()).map(([id, emergency]) => ({
      id,
      ...emergency,
      locationString: `${emergency.location?.lat}, ${emergency.location?.lng}`
    }));

    const activeMapEmergencies = mapEmergencies.filter(e => e.status === 'active');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // MongoDB data
      mongoEmergencies: {
        total: mongoEmergencies.length,
        active: activeMongoEmergencies.length,
        emergencies: mongoEmergencies.map(e => ({
          id: e._id,
          reporterName: e.reporterName,
          status: e.status,
          coordinates: e.location.coordinates, // [lng, lat]
          description: e.description,
          createdAt: e.createdAt,
          severity: e.severity
        }))
      },
      
      // In-memory Map data (legacy)
      mapEmergencies: {
        total: mapEmergencies.length,
        active: activeMapEmergencies.length,
        mapSize: activeEmergencies.size,
        emergencies: activeMapEmergencies
      },
      
      // Comparison
      dataSource: 'Now using MongoDB as primary source, Map as backup'
    });
  } catch (error: any) {
    console.error('Debug emergency error:', error);
    return NextResponse.json({ 
      error: 'Failed to get emergency data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}