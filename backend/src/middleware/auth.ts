import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User, type UserRole } from "../models/User";
import { env } from "../config/env";

export const authenticate: RequestHandler = async (req, res, next) => {
  const [scheme, token] = (req.header("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
    return;
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    res.status(401).json({ message: "Invalid access token" });
    return;
  }

  const user = await User.findById(payload.sub).select("role");
  if (!user) {
    res.status(401).json({ message: "Invalid or expired access token" });
    return;
  }
  req.auth = { userId: user.id, role: user.role };
  next();
};

export const requireRoles = (...roles: UserRole[]): RequestHandler => (req, res, next) => {
  if (!req.auth) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (!roles.includes(req.auth.role)) {
    res.status(403).json({ message: "Insufficient permissions" });
    return;
  }
  next();
};
