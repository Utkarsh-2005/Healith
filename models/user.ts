import { Schema, model, models } from "mongoose";

export interface IUser {
  _id: Schema.Types.ObjectId;
  clerkId: string;
  email?: string;
  name?: string;
  createdAt: Date;
  // Encryption fields
  encryptionSalt?: string;
  verificationHash?: string;
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
  },
  { timestamps: false }
);

export const User = models.User || model<IUser>("User", UserSchema);
