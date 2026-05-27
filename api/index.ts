import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { runDatabaseSetup } from "./dbSetup";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "cardmri_jwt_secret_2026";

// CORS
app.use(cors({
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    const lower = origin.toLowerCase();
    if (lower.endsWith(".vercel.app") || lower.endsWith(".run.app") || lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("google") || lower.includes("facebook") || lower.includes("chromium") || lower.includes("brave") || lower.includes("aistudio") || lower.includes("preview") || lower.includes("cloud")) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Supabase
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
let sbClient: any = null;
let supabase: any = null;
try {
  supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
  sbClient = supabase;
} catch (e: any) { console.warn("Supabase init:", e?.message); }

// In-memory data
const initialApplications: any[] = [{ id: "app-1", fullName: "Test", email: "test@test.com" }];
const memoryJobs: any[] = [{ id: "job-1", title: "Test Job", department: "IT", institution: "CARD", location: "Laguna", is_active: true }];
const memoryScreeningQuestions: any[] = [{ id: "q-1", text: "Test?", type: "boolean", isActive: true }];
const memoryUsers: any[] = [{ id: "user-1", email: "admin@cardmri.com", fullName: "Admin", password: "hash", role: "it_admin" }];
const memorySystemLogs: any[] = [];
const defaultHomepageSettings: any = {};
const defaultAboutSettings: any = {};

function sanitizeString(str: any): string { return typeof str === "string" ? str : ""; }
function mapJobToFrontend(j: any) { return j; }
function mapUserToFrontend(u: any) { return u; }
function mapSettingsToFrontend(s: any) { return defaultHomepageSettings; }

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET); next(); } catch { res.status(401).json({ error: "Invalid token" }); }
}
function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => req.user?.role === "it_admin" ? next() : res.status(403).json({ error: "Forbidden" }));
}

const loginAttempts = new Map<string, any>();
const loginRateLimiter = (req: any, res: any, next: any) => next();

// Health
app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err?.message || "Error" }));

export default app;
