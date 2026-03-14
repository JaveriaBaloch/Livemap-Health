import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    if (!user.verificationCode || !user.codeExpiry) {
      return NextResponse.json({ error: "Verification code not found. Please request a new one" }, { status: 400 });
    }

    if (new Date() > user.codeExpiry) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one" }, { status: 400 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Verify user
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      isActive: true,
      verificationCode: undefined,
      codeExpiry: undefined
    });

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}