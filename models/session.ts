import { Schema, model, models, Types } from "mongoose";

export interface ISession {
  _id: Schema.Types.ObjectId;
  userId: Types.ObjectId;
  sessionNumber: number;
  startedAt: Date;
  endedAt?: Date | null;
  summary?: string | null;           // Encrypted
  intensityScore?: number | null;    // 1-5 (not encrypted - used for filtering)
  messages?: Array<{ role: "user" | "assistant"; content: string }>; // Legacy - unencrypted
  encryptedMessages?: string | null; // New - encrypted blob of messages
  encryptedSummary?: string | null;  // New - encrypted summary
}

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sessionNumber: { type: Number, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  summary: { type: String, default: null },           // Legacy
  intensityScore: { type: Number, min: 1, max: 5, default: null },
  messages: { type: [MessageSchema], default: [] },   // Legacy
  encryptedMessages: { type: String, default: null }, // Encrypted messages blob
  encryptedSummary: { type: String, default: null },  // Encrypted summary
});

SessionSchema.index({ userId: 1, sessionNumber: 1 }, { unique: true });

export const Session = models.Session || model<ISession>("Session", SessionSchema);
