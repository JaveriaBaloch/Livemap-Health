import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true },
    phone: { type: String, trim: true }, // Optional now
    role: { type: String, enum: ["user", "doctor", "paramedic", "nurse"], default: "user" },
    avatar: { type: String },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""] },
    allergies: [{ type: String }],
    emergencyContacts: [
      {
        name: { type: String },
        phone: { type: String },
        relation: { type: String },
      },
    ],
    medicalCertifications: [{ type: String }],
    // Doctor-specific fields
    specialization: { type: String },
    hospital: { type: String },
    licenseNumber: { type: String },
    experience: { type: Number },
    languages: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    availableForEmergency: { type: Boolean, default: true },
    maxRadius: { type: Number, default: 8 }, // km
    // Location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    isAvailable: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    currentEmergency: { type: Schema.Types.ObjectId, ref: "Emergency" },
    lastLocationUpdate: { type: Date },
    address: { type: String },
    // Email verification fields (removed phone OTP)
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    codeExpiry: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordCodeExpiry: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ role: 1, specialization: 1 });

export default models.User || model("User", UserSchema);
