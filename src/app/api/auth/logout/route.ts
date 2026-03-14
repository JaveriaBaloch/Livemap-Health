import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('token')?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any;
        // Update user online status
        await User.findByIdAndUpdate(decoded.userId, { isOnline: false });
      } catch (error) {
        // Token invalid, but still proceed with logout
        console.log('Invalid token during logout, proceeding anyway');
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    
    // Clear the HTTP-only cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}