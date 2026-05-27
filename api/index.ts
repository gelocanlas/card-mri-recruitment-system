import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.on("unhandledRejection", (reason) => { console.error("UNHANDLED REJECTION:", reason); });

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "cardmri_jwt_secret_2026";

app.use(cors({ origin: (_o: any, cb: any) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Supabase client (wrapped)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
let sbClient: any = null;
let supabase: any = null;
try { sbClient = createClient(supabaseUrl || "", supabaseAnonKey || ""); supabase = sbClient; } catch (e: any) { console.warn("Supabase:", e?.message); }

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
    req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch (e: any) { res.status(401).json({ error: "Invalid token", detail: e.message }); }
}
function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => req.user?.role === "it_admin" ? next() : res.status(403).json({ error: "Forbidden" }));
}

const loginRateLimiter = function(req: any, res: any, next: any) { console.log("RATE LIMITER CALLED"); next(); };

// In-memory data
const memoryUsers: any[] = [
  { id: "user-1", email: "admin@cardmri.com", fullName: "Admin", password: "$2a$12$K1R2TfWlQ2E.8P3u1hSDeOmI6qR9Xm5tU0k9eT3tY2e5e1mSu3G4q", role: "it_admin" }
];
const memoryJobs: any[] = [];
const memoryApplications: any[] = [];
const memoryScreeningQuestions: any[] = [
  { id: "q-1", text: "Test?", type: "boolean", isActive: true }
];
const memorySystemLogs: any[] = [];

function sanitizeString(str: any): string { return typeof str === "string" ? str : ""; }
function mapJobToFrontend(j: any) { return j; }
function mapUserToFrontend(u: any) { return { id: u.id, email: u.email, fullName: u.fullName, role: u.role }; }
function mapSettingsToFrontend(s: any) { return {}; }

async function writeLog(actor: string, op: string, details: string) {
  const entry = { id: `log-${Date.now()}`, actor, operation: op, details, timestamp: new Date().toISOString() };
  memorySystemLogs.unshift(entry);
  try { if (sbClient) await sbClient.from("system_logs").insert([entry]); } catch {}
}

// ============ ROUTES ============

app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));

app.get("/api/jobs", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("jobs").select("*").order("created_at", { ascending: false });
      if (!error && data) return res.json(data.map(mapJobToFrontend));
    }
  } catch {}
  res.json(memoryJobs.map(mapJobToFrontend));
});

app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }
    let dbUser: any = null;
    try {
      if (sbClient) {
        const { data } = await sbClient.from("users").select("*").ilike("email", email.toLowerCase()).maybeSingle();
        if (data) dbUser = data;
      }
    } catch {}
    if (!dbUser) dbUser = memoryUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!dbUser) { res.status(401).json({ error: "User not found" }); return; }
    let match = false;
    try { match = await bcrypt.compare(password, dbUser.password); } catch (e: any) { res.status(500).json({ error: "bcrypt: " + e.message }); return; }
    if (!match) { res.status(401).json({ error: "Invalid password" }); return; }
    const token = jwt.sign({ id: dbUser.id, email, role: dbUser.role, fullName: dbUser.fullName || dbUser.full_name }, JWT_SECRET, { expiresIn: "6h" });
    await writeLog(email, "Login", "Success");
    res.json({ message: "Login ok", user: { ...mapUserToFrontend(dbUser), token } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/users", requireAuth, async (_req: any, res: any) => {
  try {
    let users: any[] = [];
    try { if (sbClient) { const { data } = await sbClient.from("users").select("*"); if (data) users = data; } } catch {}
    if (users.length === 0) users = memoryUsers;
    res.json(users.map(mapUserToFrontend));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/screening-questions", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("screening_questions").select("*").order("sort_order");
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memoryScreeningQuestions);
});

app.get("/api/system-settings/:key", async (req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("system_settings").select("value").eq("key", req.params.key).maybeSingle();
      if (!error && data) return res.json({ value: data.value });
    }
  } catch {}
  res.json({ value: null });
});

app.get("/api/applications", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("applicants").select("*").order("applied_at", { ascending: false });
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memoryApplications);
});

app.get("/api/homepage-settings", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("homepage_settings").select("*").maybeSingle();
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json({});
});

app.get("/api/about-settings", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("about_settings").select("*").maybeSingle();
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json({});
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Express:", err);
  res.status(500).json({ error: err?.message || "Express error" });
});

export default app;
