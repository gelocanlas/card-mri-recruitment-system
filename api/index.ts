import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { runDatabaseSetup } from "./dbSetup";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "cardmri_jwt_secret_2026";

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey;
const sbClient = createClient(supabaseUrl, supabaseAnonKey);
const supabase = sbClient;
const sbAdminClient = createClient(supabaseUrl, supabaseServiceKey);

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now(), env: { supabaseUrl: !!supabaseUrl } });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown error" });
});

export default app;
