import { Router } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { authenticate, requireRoles } from "../middleware/auth";
import { Note } from "../models/Note";
import { Post } from "../models/Post";
import { User, type UserRole } from "../models/User";
import { parseInterests } from "../utils/interests";
import { parsePagination } from "../utils/pagination";

export const usersRouter = Router();

function validObjectId(value: unknown): value is string {
  return typeof value === "string" && Types.ObjectId.isValid(value);
}

const serializeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

usersRouter.get("/interest-groups", authenticate, requireRoles("admin"), async (req, res) => {
  const pagination = parsePagination(req.query.page, req.query.limit);
  if (!pagination) {
    res.status(400).json({ message: "page and limit must be positive integers; limit cannot exceed 100" });
    return;
  }

  const groups = await User.aggregate([
    { $match: { interests: { $type: "string" } } },
    { $unwind: "$interests" },
    {
      $group: {
        _id: "$interests",
        users: { $push: { id: "$_id", name: "$name", email: "$email" } },
      },
    },
    { $sort: { _id: 1 } },
    { $skip: pagination.skip },
    { $limit: pagination.limit + 1 },
    { $project: { _id: 0, interest: "$_id", users: 1 } },
  ]);
  const hasMore = groups.length > pagination.limit;
  if (hasMore) {
    groups.pop();
  }
  res.json({
    groups,
    pagination: { page: pagination.page, limit: pagination.limit, hasMore },
  });
});

usersRouter.get("/:id/posts", async (req, res) => {
  const userId = req.params.id;
  if (!validObjectId(userId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  const pagination = parsePagination(req.query.page, req.query.limit);
  if (!pagination) {
    res.status(400).json({ message: "page and limit must be positive integers; limit cannot exceed 100" });
    return;
  }

  const [result] = await User.aggregate([
    { $match: { _id: new Types.ObjectId(userId) } },
    {
      $lookup: {
        from: Post.collection.name,
        localField: "_id",
        foreignField: "owner",
        pipeline: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: pagination.skip },
          { $limit: pagination.limit + 1 },
          {
            $project: {
              _id: 0,
              id: "$_id",
              title: 1,
              content: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: "posts",
      },
    },
    { $project: { _id: 0, user: { id: "$_id", name: "$name" }, posts: 1 } },
  ]);
  if (!result) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const hasMore = result.posts.length > pagination.limit;
  res.json({
    user: result.user,
    posts: result.posts.slice(0, pagination.limit),
    pagination: { page: pagination.page, limit: pagination.limit, hasMore },
  });
});

usersRouter.get("/:id", authenticate, async (req, res) => {
  const userId = req.params.id;
  if (!validObjectId(userId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  if (req.auth!.role !== "admin" && req.auth!.userId !== userId) {
    res.status(403).json({ message: "Insufficient permissions" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ user: serializeUser(user) });
});

usersRouter.use(authenticate, requireRoles("admin"));

usersRouter.get("/", async (req, res) => {
  const pagination = parsePagination(req.query.page, req.query.limit);
  if (!pagination) {
    res.status(400).json({ message: "page and limit must be positive integers; limit cannot exceed 100" });
    return;
  }

  const users = await User.find()
    .sort({ createdAt: -1, _id: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit + 1);
  const hasMore = users.length > pagination.limit;
  if (hasMore) {
    users.pop();
  }
  res.json({
    users: users.map(serializeUser),
    pagination: { page: pagination.page, limit: pagination.limit, hasMore },
  });
});

usersRouter.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role === undefined ? "user" : req.body.role;
  const interests = req.body?.interests === undefined ? [] : parseInterests(req.body.interests);

  if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8 || password.length > 72 ||
      (role !== "user" && role !== "admin") || !interests) {
    res.status(400).json({
      message: "Provide a name, valid email, password of 8–72 characters, valid role, and up to 50 interests",
    });
    return;
  }
  if (await User.exists({ email })) {
    res.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const user = await User.create({
    name,
    email,
    role,
    interests,
    passwordHash: await bcrypt.hash(password, 12),
  });
  res.status(201).json({ user: serializeUser(user) });
});

usersRouter.patch("/:id", async (req, res) => {
  const userId = req.params.id;
  if (!validObjectId(userId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  const hasName = Object.prototype.hasOwnProperty.call(req.body ?? {}, "name");
  const hasEmail = Object.prototype.hasOwnProperty.call(req.body ?? {}, "email");
  const hasRole = Object.prototype.hasOwnProperty.call(req.body ?? {}, "role");
  const hasPassword = Object.prototype.hasOwnProperty.call(req.body ?? {}, "password");
  const hasInterests = Object.prototype.hasOwnProperty.call(req.body ?? {}, "interests");
  if (!hasName && !hasEmail && !hasRole && !hasPassword && !hasInterests) {
    res.status(400).json({ message: "Provide at least one user field to update" });
    return;
  }

  const update: { name?: string; email?: string; role?: UserRole; passwordHash?: string; interests?: string[] } = {};
  if (hasName) {
    if (typeof req.body.name !== "string" || !req.body.name.trim() || req.body.name.trim().length > 100) {
      res.status(400).json({ message: "Name must be 1–100 characters" });
      return;
    }
    update.name = req.body.name.trim();
  }
  if (hasEmail) {
    if (typeof req.body.email !== "string" || !/^\S+@\S+\.\S+$/.test(req.body.email.trim())) {
      res.status(400).json({ message: "Provide a valid email address" });
      return;
    }
    update.email = req.body.email.trim().toLowerCase();
    if (await User.exists({ email: update.email, _id: { $ne: userId } })) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }
  }
  if (hasRole) {
    if (req.body.role !== "user" && req.body.role !== "admin") {
      res.status(400).json({ message: "Role must be user or admin" });
      return;
    }
    update.role = req.body.role;
  }
  if (hasInterests) {
    const interests = parseInterests(req.body.interests);
    if (!interests) {
      res.status(400).json({ message: "Interests must be an array of up to 50 non-empty strings (50 characters max)" });
      return;
    }
    update.interests = interests;
  }
  if (hasPassword) {
    if (typeof req.body.password !== "string" ||
        req.body.password.length < 8 || req.body.password.length > 72) {
      res.status(400).json({ message: "Password must be 8–72 characters" });
      return;
    }
    update.passwordHash = await bcrypt.hash(req.body.password, 12);
  }

  const user = await User.findByIdAndUpdate(userId, { $set: update }, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ user: serializeUser(user) });
});

usersRouter.delete("/:id", async (req, res) => {
  const userId = req.params.id;
  if (!validObjectId(userId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await Note.deleteMany({ owner: user._id });
  await Post.deleteMany({ owner: user._id });
  res.json({ message: "User and their notes and posts deleted" });
});
