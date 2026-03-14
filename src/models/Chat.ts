import { Schema, models, model } from "mongoose";

const ChatSchema = new Schema(
  {
    type: { type: String, enum: ["public", "private", "emergency"], required: true },
    name: { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    participantNames: [{ type: String }],
    emergencyId: { type: Schema.Types.ObjectId, ref: "Emergency" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ type: 1 });

export default models.Chat || model("Chat", ChatSchema);
