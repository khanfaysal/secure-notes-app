import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../models/User";
import { env } from "../config/env";

interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  role: UserRole;
}

export const authenticate: RequestHandler = (req, res, next) => {
  const [scheme, token] = (req.header("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string" ||
        (payload.role !== "user" && payload.role !== "admin")) {
      res.status(401).json({ message: "Invalid access token" });
      return;
    }
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
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
