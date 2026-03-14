import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET user profile
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = req.nextUrl.searchParams.get("id");
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const user = await User.findById(userId).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, ...updateData } = body;

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // Handle location update
    if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [updateData.longitude, updateData.latitude],
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
