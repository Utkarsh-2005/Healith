import { Schema, model, models, Types } from "mongoose";

export interface ILongTermMemory {
  _id: Schema.Types.ObjectId;
  userId: Types.ObjectId;
  content: string;            // Legacy - unencrypted
  encryptedContent?: string;  // New - encrypted content
  updatedAt: Date;
}

const LongTermMemorySchema = new Schema<ILongTermMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    content: { type: String, default: "" },           // Legacy
    encryptedContent: { type: String, default: null }, // Encrypted content blob
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

LongTermMemorySchema.index({ userId: 1 }, { unique: true });

export const LongTermMemory =
  models.LongTermMemory || model<ILongTermMemory>("LongTermMemory", LongTermMemorySchema);
