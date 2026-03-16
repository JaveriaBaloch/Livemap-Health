import { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["status", "chat", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String, default: "🔔" },
    color: { type: String, default: "#3b82f6" },
    read: { type: Boolean, default: false, index: true },

    // References
    emergencyId: { type: Schema.Types.ObjectId, ref: "Emergency" },
    chatId: { type: String },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    fromUserName: { type: String },

    // Status-specific
    status: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default models.Notification || model("Notification", NotificationSchema);