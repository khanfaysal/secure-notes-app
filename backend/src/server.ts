import mongoose from "mongoose";
import { app } from "./app";
import { env } from "./config/env";

async function start(): Promise<void> {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");
  app.listen(env.port, () => console.log(`API listening on port ${env.port}`));
}

start().catch((error: unknown) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
