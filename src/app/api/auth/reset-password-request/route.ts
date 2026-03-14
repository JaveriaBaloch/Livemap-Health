import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmailVerification } from "@/lib/firebase";

// Generate 6-digit reset code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email verification sending function
async function sendResetEmail(email: string, code: string): Promise<boolean> {
  try {
    const success = await sendEmailVerification(email, code, true); // true for password reset
    console.log(`Password reset email sent to ${email}: ${code}`);
    return success;
  } catch (error: any) {
    console.error("Password reset email sending failed:", error);
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
      return NextResponse.json({ error: "User not found with this email address" }, { status: 404 });
    }

    // Generate new reset code for password reset
    const resetCode = generateResetCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      resetPasswordCode: resetCode,
      resetPasswordCodeExpiry: resetCodeExpiry
    });

    // Send reset code via Email
    await sendResetEmail(email, resetCode);

    return NextResponse.json({ 
      message: "Password reset code sent to your email"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: error.message || "Failed to send reset OTP" }, { status: 500 });
  }
}