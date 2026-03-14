import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendSMSVerification } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via SMS using Firebase
    const message = `Your LiveMap verification code is: ${otp}. This code will expire in 10 minutes.`;
    try {
      const smsSuccess = await sendSMSVerification(phone, message);
      if (smsSuccess) {
        console.log(`Firebase SMS sent successfully to ${phone}: ${otp}`);
      } else {
        console.log(`Firebase SMS failed, using fallback - OTP for ${phone}: ${otp}`);
      }
    } catch (smsError: any) {
      console.error("Firebase SMS sending failed:", smsError);
      // Fallback: log OTP for development
      console.log(`Fallback - OTP for ${phone}: ${otp}`);
    }

    // Store temporary OTP (you might want to use Redis or similar for this)
    const tempUser = {
      phone,
      otp,
      otpExpiry,
      isWelcome: true
    };

    // For demo, we'll store in a global variable or use a simple cache
    // In production, use proper session management
    global.tempWelcomeOtp = global.tempWelcomeOtp || {};
    global.tempWelcomeOtp[phone] = tempUser;

    return NextResponse.json({ 
      message: "Welcome to LiveMap! Please verify your phone number with the OTP sent via SMS.",
      phone: phone
    }, { status: 200 });

  } catch (error: any) {
    console.error("Welcome OTP error:", error);
    return NextResponse.json({ error: error.message || "Failed to send welcome OTP" }, { status: 500 });
  }
}