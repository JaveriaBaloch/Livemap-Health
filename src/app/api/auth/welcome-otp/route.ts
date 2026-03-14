
import { NextRequest, NextResponse } from "next/server";
import { sendEmailVerification } from "@/lib/firebase";

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via Email
    const message = `Your LiveMap verification code is: ${otp}. This code will expire in 10 minutes.`;
    try {
      const emailSuccess = await sendEmailVerification(email, otp, false);
      if (emailSuccess) {
        console.log(`Email sent successfully to ${email}: ${otp}`);
      } else {
        console.log(`Email failed, using fallback - OTP for ${email}: ${otp}`);
      }
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError);
      // Fallback: log OTP for development
      console.log(`Fallback - OTP for ${email}: ${otp}`);
    }

    // Store temporary OTP (you might want to use Redis or similar for this)
    const tempUser = {
      email,
      otp,
      otpExpiry,
      isWelcome: true
    };

    // For demo, we'll store in a global variable or use a simple cache
    // In production, use proper session management
    global.tempWelcomeOtp = global.tempWelcomeOtp || {};
    global.tempWelcomeOtp[email] = tempUser;

    return NextResponse.json({ 
      message: "Welcome to LiveMap! Please verify your email with the OTP sent to your inbox.",
      email: email
    }, { status: 200 });

  } catch (error: any) {
    console.error("Welcome OTP error:", error);
    return NextResponse.json({ error: error.message || "Failed to send welcome OTP" }, { status: 500 });
  }
}