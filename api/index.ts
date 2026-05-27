import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(cors({
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    const lower = origin.toLowerCase();
    if (
      lower.endsWith(".vercel.app") ||
      lower.endsWith(".run.app") ||
      lower.includes("localhost") ||
      lower.includes("127.0.0.1") ||
      lower.includes("google") ||
      lower.includes("facebook") ||
      lower.includes("chromium") ||
      lower.includes("brave")
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown error" });
});

export default app;
