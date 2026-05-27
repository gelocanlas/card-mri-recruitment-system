import express from "express";
import cors from "cors";

const app = express();

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown error" });
});

export default app;
