import { Schema, model, models } from "mongoose";

export type CompanionStyle = "lua" | "leon";

export interface IUser {
  _id: Schema.Types.ObjectId;
  clerkId: string;
  email?: string;
  name?: string;
  createdAt: Date;
  // Encryption fields
  encryptionSalt?: string;
  verificationHash?: string;
  // Companion style
  companion?: CompanionStyle | null;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
    // Encryption fields - salt for key derivation, hash for passphrase verification
    encryptionSalt: { type: String, default: null },
    verificationHash: { type: String, default: null },
    // Companion style
    companion: { type: String, enum: ["lua", "leon", null], default: null },
  },
  { timestamps: false }
);

export const User = models.User || model<IUser>("User", UserSchema);
