import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, reset code, and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.resetPasswordCode || !user.resetPasswordCodeExpiry) {
      return NextResponse.json({ error: "Reset code not found. Please request a new one" }, { status: 400 });
    }

    if (new Date() > user.resetPasswordCodeExpiry) {
      return NextResponse.json({ error: "Reset code expired. Please request a new one" }, { status: 400 });
    }

    if (user.resetPasswordCode !== code) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordCode: undefined,
      resetPasswordCodeExpiry: undefined
    });

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: error.message || "Password reset failed" }, { status: 500 });
  }
}