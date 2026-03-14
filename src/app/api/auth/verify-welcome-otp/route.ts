import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    // Check temporary OTP storage
    const tempOtpData = global.tempWelcomeOtp?.[phone];
    
    if (!tempOtpData) {
      return NextResponse.json({ error: "No OTP found for this phone number. Please request a new one." }, { status: 400 });
    }

    if (new Date() > tempOtpData.otpExpiry) {
      delete global.tempWelcomeOtp[phone];
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    if (tempOtpData.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Clean up
    delete global.tempWelcomeOtp[phone];

    return NextResponse.json({ 
      message: "Phone verified successfully! Welcome to LiveMap.",
      verified: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Welcome OTP verification error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}