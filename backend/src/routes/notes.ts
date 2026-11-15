import { Router } from "express";
import { authenticate, requireRoles } from "../middleware/auth";
import { Note } from "../models/Note";

export const notesRouter = Router();

notesRouter.post("/", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const content = typeof req.body?.content === "string" ? req.body.content : "";

  if (!title || title.length > 200 || !content.trim() || content.length > 50_000) {
    res.status(400).json({ message: "Provide a title (up to 200 characters) and content (up to 50,000 characters)" });
    return;
  }

  const note = await Note.create({ title, content, owner: req.auth!.userId });
  res.status(201).json({
    note: {
      id: note.id,
      title: note.title,
      content: note.content,
      owner: note.owner,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
  });
});
