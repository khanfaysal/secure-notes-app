import express from "express";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";

export const app = express();

app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});
