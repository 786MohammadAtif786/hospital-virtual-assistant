import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    sources: { type: Array, default: [] },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
