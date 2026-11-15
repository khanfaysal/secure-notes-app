import { Router } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { authenticate, requireRoles } from "../middleware/auth";
import { Note } from "../models/Note";
import { User, type UserRole } from "../models/User";

export const usersRouter = Router();

const serializeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

usersRouter.use(authenticate, requireRoles("admin"));

usersRouter.get("/", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(serializeUser) });
});

usersRouter.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role === undefined ? "user" : req.body.role;

  if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8 || password.length > 72 ||
      (role !== "user" && role !== "admin")) {
    res.status(400).json({ message: "Provide a name, valid email, password of 8–72 characters, and valid role" });
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
    passwordHash: await bcrypt.hash(password, 12),
  });
  res.status(201).json({ user: serializeUser(user) });
});

usersRouter.patch("/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  const hasName = Object.prototype.hasOwnProperty.call(req.body ?? {}, "name");
  const hasEmail = Object.prototype.hasOwnProperty.call(req.body ?? {}, "email");
  const hasRole = Object.prototype.hasOwnProperty.call(req.body ?? {}, "role");
  const hasPassword = Object.prototype.hasOwnProperty.call(req.body ?? {}, "password");
  if (!hasName && !hasEmail && !hasRole && !hasPassword) {
    res.status(400).json({ message: "Provide at least one user field to update" });
    return;
  }

  const update: { name?: string; email?: string; role?: UserRole; passwordHash?: string } = {};
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
    if (await User.exists({ email: update.email, _id: { $ne: req.params.id } })) {
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
  if (hasPassword) {
    if (typeof req.body.password !== "string" ||
        req.body.password.length < 8 || req.body.password.length > 72) {
      res.status(400).json({ message: "Password must be 8–72 characters" });
      return;
    }
    update.passwordHash = await bcrypt.hash(req.body.password, 12);
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, {
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
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await Note.deleteMany({ owner: user._id });
  res.json({ message: "User and their notes deleted" });
});
