import { Schema, model } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);
