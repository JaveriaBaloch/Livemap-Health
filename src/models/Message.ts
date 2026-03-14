import { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "location", "profile", "emergency", "image"], default: "text" },
    metadata: {
      latitude: Number,
      longitude: Number,
      profileData: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: -1 });

export default models.Message || model("Message", MessageSchema);
