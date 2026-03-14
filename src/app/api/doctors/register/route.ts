import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'test'; // Using existing database

let client: MongoClient | null = null;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const { name, specialization, phone, email, location, isAvailable = true } = await request.json();

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
    }

    const mongoClient = await getMongoClient();
    const db = mongoClient.db(DATABASE_NAME);
    
    const doctor = {
      _id: new ObjectId(),
      name,
      specialization: specialization || 'General Practice',
      phone: phone || '+1-555-0000',
      email: email || `${name.toLowerCase().replace(' ', '.')}@hospital.com`,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat] // MongoDB format: [longitude, latitude]
      },
      isAvailable,
      rating: Math.random() * (5.0 - 4.0) + 4.0, // Random rating between 4.0-5.0
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('doctors').insertOne(doctor);

    // Create a geospatial index if it doesn't exist
    try {
      await db.collection('doctors').createIndex({ location: '2dsphere' });
    } catch (err) {
      // Index might already exist, ignore error
      console.log('Location index already exists or creation failed:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Doctor registered successfully',
      doctorId: doctor._id.toString()
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to register doctor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '8000'); // Default 8km

    const mongoClient = await getMongoClient();
    const db = mongoClient.db(DATABASE_NAME);
    
    let doctors;
    
    if (lat && lng) {
      // Find doctors near the specified location
      doctors = await db.collection('doctors').find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius
          }
        },
        isAvailable: true
      }).limit(20).toArray();
    } else {
      // Get all available doctors
      doctors = await db.collection('doctors').find({ isAvailable: true }).limit(20).toArray();
    }

    return NextResponse.json({
      success: true,
      doctors: doctors.map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        specialization: doc.specialization,
        phone: doc.phone,
        email: doc.email,
        rating: doc.rating,
        location: {
          lat: doc.location.coordinates[1],
          lng: doc.location.coordinates[0]
        },
        isAvailable: doc.isAvailable
      }))
    });

  } catch (error) {
    console.error('Doctor listing error:', error);
    return NextResponse.json({ 
      error: 'Failed to get doctors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}