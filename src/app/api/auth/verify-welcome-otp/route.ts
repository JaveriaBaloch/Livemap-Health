import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Check temporary OTP storage
    const tempOtpData = global.tempWelcomeOtp?.[email];
    
    if (!tempOtpData) {
      return NextResponse.json({ error: "No OTP found for this email. Please request a new one." }, { status: 400 });
    }

    if (new Date() > tempOtpData.otpExpiry) {
      delete global.tempWelcomeOtp[email];
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    if (tempOtpData.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Clean up
    delete global.tempWelcomeOtp[email];

    return NextResponse.json({ 
      message: "Email verified successfully! Welcome to LiveMap.",
      verified: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Welcome OTP verification error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}