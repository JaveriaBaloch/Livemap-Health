import { Schema, models, model } from "mongoose";

// Force recreation of the model to ensure schema changes are applied
delete models.Emergency;

const EmergencySchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporterName: { type: String, required: true },
    reporterPhone: { type: String, required: false, default: 'Not provided' },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String },
    description: { type: String, required: true },
    severity: { type: String, enum: ["critical", "high", "medium", "low"], default: "high" },
    status: { type: String, enum: ["active", "responded", "resolved", "cancelled", "accepted", "in-progress", "en-route", "arrived"], default: "active" },
    
    // Doctor acceptance fields - explicitly defined
    acceptedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: false,
      default: null
    },
    acceptedAt: { 
      type: Date,
      required: false,
      default: null
    },
    
    // Patient information (duplicated from User for emergency context)
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // Patient who created the emergency
    patientName: { type: String },
    phoneNumber: { type: String },
    age: { type: Number },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    
    // Coordinate fields for backward compatibility
    latitude: { type: Number },
    longitude: { type: Number },
    
    healthData: {
      bloodGroup: String,
      allergies: [String],
      conditions: [String],
    },
    notifiedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    respondedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
    radius: { type: Number, default: 300 }, // meters
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

EmergencySchema.index({ location: "2dsphere" });
EmergencySchema.index({ status: 1 });

export default models.Emergency || model("Emergency", EmergencySchema);
