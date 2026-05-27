import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors({ origin: (_o: any, cb: any) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown error" });
});

export default app;
