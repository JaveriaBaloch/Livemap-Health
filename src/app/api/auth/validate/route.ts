import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any;
      const user = await User.findById(decoded.userId).select('-password -verificationCode -resetPasswordCode');
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      if (!user.emailVerified) {
        return NextResponse.json({ error: "Email not verified" }, { status: 401 });
      }

      return NextResponse.json({ 
        user: user.toObject(),
        message: "Token valid" 
      });
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}