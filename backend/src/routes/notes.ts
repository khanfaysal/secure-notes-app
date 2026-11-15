import { Router } from "express";
import { Types } from "mongoose";
import { authenticate, requireRoles } from "../middleware/auth";
import { Note } from "../models/Note";

export const notesRouter = Router();

const serializeNote = (note: {
  id: string;
  title: string;
  content: string;
  owner: unknown;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: note.id,
  title: note.title,
  content: note.content,
  owner: note.owner,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

notesRouter.get("/", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const filter = req.auth!.role === "admin" ? {} : { owner: req.auth!.userId };
  const notes = await Note.find(filter).sort({ createdAt: -1 });
  res.json({ notes: notes.map(serializeNote) });
});

notesRouter.post("/", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const content = typeof req.body?.content === "string" ? req.body.content : "";

  if (!title || title.length > 200 || !content.trim() || content.length > 50_000) {
    res.status(400).json({ message: "Provide a title (up to 200 characters) and content (up to 50,000 characters)" });
    return;
  }

  const note = await Note.create({ title, content, owner: req.auth!.userId });
  res.status(201).json({ note: serializeNote(note) });
});

notesRouter.get("/:id", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (typeof noteId !== "string" || !Types.ObjectId.isValid(noteId)) {
    res.status(400).json({ message: "Invalid note ID" });
    return;
  }
  const filter = req.auth!.role === "admin"
    ? { _id: noteId }
    : { _id: noteId, owner: req.auth!.userId };
  const note = await Note.findOne(filter);

  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }
  res.json({ note: serializeNote(note) });
});

notesRouter.patch("/:id", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (typeof noteId !== "string" || !Types.ObjectId.isValid(noteId)) {
    res.status(400).json({ message: "Invalid note ID" });
    return;
  }
  const hasTitle = Object.prototype.hasOwnProperty.call(req.body ?? {}, "title");
  const hasContent = Object.prototype.hasOwnProperty.call(req.body ?? {}, "content");
  if (!hasTitle && !hasContent) {
    res.status(400).json({ message: "Provide a title or content to update" });
    return;
  }

  const update: { title?: string; content?: string } = {};
  if (hasTitle) {
    if (typeof req.body.title !== "string" || !req.body.title.trim() || req.body.title.trim().length > 200) {
      res.status(400).json({ message: "Title must be 1–200 characters" });
      return;
    }
    update.title = req.body.title.trim();
  }
  if (hasContent) {
    if (typeof req.body.content !== "string" || !req.body.content.trim() || req.body.content.length > 50_000) {
      res.status(400).json({ message: "Content must be 1–50,000 characters" });
      return;
    }
    update.content = req.body.content;
  }

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.auth!.userId },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }
  res.json({ note: serializeNote(note) });
});

notesRouter.delete("/:id", authenticate, requireRoles("user", "admin"), async (req, res) => {
  const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (typeof noteId !== "string" || !Types.ObjectId.isValid(noteId)) {
    res.status(400).json({ message: "Invalid note ID" });
    return;
  }
  const note = await Note.findOneAndDelete({ _id: noteId, owner: req.auth!.userId });
  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }
  res.json({ message: "Note deleted" });
});
