import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
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
    // Fallback: log message for development
    console.log(`Fallback - Verification code for ${email}: ${code}`);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting registration process...");
    await dbConnect();
    console.log("Database connected successfully");

    const body = await req.json();
    console.log("Request body received:", { ...body, password: "[hidden]" });

    const { name, email, password, phone, role, specialization, licenseNumber, experience, hospital, languages, bloodGroup, allergies, emergencyContacts } = body;

    // Validation - phone and email are now both required
    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Name, email, phone, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email or phone already exists
    console.log("Checking for existing user with email or phone:", email, phone);
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    const existingPhone = await User.findOne({ phone: phone.trim() });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
    }

    // Doctor validation
    if (role === "doctor") {
      if (!specialization || !licenseNumber) {
        return NextResponse.json({ error: "Specialization and license number are required for doctors" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const userData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(), // Phone is now required
      role: role || "user",
      bloodGroup: bloodGroup || "",
      allergies: allergies || [],
      emergencyContacts: emergencyContacts || [],
      verificationCode,
      codeExpiry,
      emailVerified: false,
      isActive: false
    };

    if (role === "doctor") {
      userData.specialization = specialization;
      userData.licenseNumber = licenseNumber;
      userData.experience = experience || 0;
      userData.hospital = hospital || "";
      userData.languages = languages || [];
      userData.availableForEmergency = true;
      userData.maxRadius = 8;
      userData.rating = 0;
      userData.reviewCount = 0;
    }

    const user = await User.create(userData);

    // Send verification code via Email
    await sendVerificationEmail(email, verificationCode);

    const { password: _, verificationCode: __, ...userWithoutSensitive } = user.toObject();

    return NextResponse.json({
      user: userWithoutSensitive,
      message: "Registration successful. Please check your email for verification code.",
      requiresVerification: true
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
