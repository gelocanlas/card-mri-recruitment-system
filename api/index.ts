import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();

app.use(cors({ origin: (_o: any, cb: any) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Wrap Supabase client creation - createClient throws with empty URL
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
let sbClient: any = null;
try {
  sbClient = createClient(supabaseUrl || "", supabaseAnonKey || "");
} catch (e: any) {
  console.warn("Supabase init skipped:", e?.message);
}

const JWT_SECRET = process.env.JWT_SECRET || "cardmri_jwt_secret_2026";

// Health endpoint
app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Simple test endpoint
app.get("/api/test", (_req: any, res: any) => {
  res.json({ message: "test ok", hasSbClient: !!sbClient, supabaseUrl: !!supabaseUrl });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown error" });
});

export default app;
