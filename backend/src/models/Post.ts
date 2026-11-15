import { Schema, model, Types } from "mongoose";

export interface IPost {
  title: string;
  content: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 50_000 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

postSchema.index({ owner: 1, createdAt: -1, _id: -1 });
postSchema.index({ createdAt: -1, _id: -1 });

export const Post = model<IPost>("Post", postSchema);
