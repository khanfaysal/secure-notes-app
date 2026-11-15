import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { parseInterests } from "../utils/interests";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const interests = req.body?.interests === undefined ? [] : parseInterests(req.body.interests);

  if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8 || password.length > 72 || !interests) {
    res.status(400).json({
      message: "Provide a name, valid email, password of 8–72 characters, and up to 50 valid interests",
    });
    return;
  }

  const existing = await User.exists({ email });
  if (existing) {
    res.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const user = await User.create({
    name,
    email,
    interests,
    passwordHash: await bcrypt.hash(password, 12),
  });
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, interests: user.interests },
  });
});

authRouter.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
  res.json({
    token,
    tokenType: "Bearer",
    user: { id: user.id, name: user.name, email: user.email, role: user.role, interests: user.interests },
  });
});
