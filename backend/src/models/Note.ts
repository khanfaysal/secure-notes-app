import { Schema, model, Types } from "mongoose";

export interface INote {
  title: string;
  content: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 50_000 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

noteSchema.index({ owner: 1, createdAt: -1 });

export const Note = model<INote>("Note", noteSchema);
