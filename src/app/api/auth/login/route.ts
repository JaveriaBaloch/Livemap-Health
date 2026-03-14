import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      specialization: user.specialization
    });

    if (!user.emailVerified) {
      console.log('Login failed: Email not verified for user:', user.email);
      return NextResponse.json({ 
        error: "Please verify your email address first",
        requiresVerification: true,
        email: user.email
      }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Update online status
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    const { password: _, verificationCode: __, resetPasswordCode: ___, ...userWithoutSensitive } = user.toObject();

    const response = NextResponse.json({ user: userWithoutSensitive, token, message: "Login successful" });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
