import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmailVerification } from "@/lib/firebase";

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email verification sending function
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const success = await sendEmailVerification(email, code);
    console.log(`Email verification sent to ${email}: ${code}`);
    return success;
  } catch (error: any) {
    console.error("Email verification sending failed:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      verificationCode,
      codeExpiry
    });

    // Send verification code via Email
    await sendVerificationEmail(email, verificationCode);

    return NextResponse.json({ 
      message: "New verification code sent to your email",
      email: email
    }, { status: 200 });

  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: error.message || "Failed to resend OTP" }, { status: 500 });
  }
}