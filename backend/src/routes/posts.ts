import { Router } from "express";
import { authenticate, requireRoles } from "../middleware/auth";
import { Post } from "../models/Post";
import { parsePagination } from "../utils/pagination";

export const postsRouter = Router();

const serializePost = (post: {
  id: string;
  title: string;
  content: string;
  owner: unknown;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  owner: post.owner,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

postsRouter.get("/", async (req, res) => {
  const pagination = parsePagination(req.query.page, req.query.limit);
  if (!pagination) {
    res.status(400).json({ message: "page and limit must be positive integers; limit cannot exceed 100" });
    return;
  }

  const posts = await Post.find()
    .sort({ createdAt: -1, _id: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit + 1);
  const hasMore = posts.length > pagination.limit;
  if (hasMore) {
    posts.pop();
  }
  res.json({
    posts: posts.map(serializePost),
    pagination: { page: pagination.page, limit: pagination.limit, hasMore },
  });
});

postsRouter.post("/", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  if (!title || title.length > 200 || !content.trim() || content.length > 50_000) {
    res.status(400).json({ message: "Provide a title (up to 200 characters) and content (up to 50,000 characters)" });
    return;
  }

  const post = await Post.create({ title, content, owner: req.auth!.userId });
  res.status(201).json({ post: serializePost(post) });
});
