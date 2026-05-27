import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.on("unhandledRejection", (reason) => { console.error("UNHANDLED REJECTION:", reason); });

function persistPath(): string {
  return path.join(process.cwd(), "api", ".data.json");
}

let persistedData: Record<string, any> = {};
function loadPersistedData(): Record<string, any> {
  try {
    const p = persistPath();
    if (fs.existsSync(p)) {
      persistedData = JSON.parse(fs.readFileSync(p, "utf8"));
      return persistedData;
    }
  } catch (e: any) { console.warn("Persist load:", e.message); }
  return {};
}
function savePersistedData(key: string, value: any) {
  persistedData[key] = value;
  try {
    fs.writeFileSync(persistPath(), JSON.stringify(persistedData, null, 2), "utf8");
  } catch (e: any) { console.warn("Persist save:", e.message); }
}
loadPersistedData();

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

// Auth helpers
function checkAuth(req: any, res: any): boolean {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return false; }
  try { req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET); return true; }
  catch (e: any) { res.status(401).json({ error: "Invalid token", detail: e.message }); return false; }
}
function checkAdmin(req: any, res: any): boolean {
  if (!checkAuth(req, res)) return false;
  if (req.user?.role !== "it_admin") { res.status(403).json({ error: "Forbidden" }); return false; }
  return true;
}

// ============ HELPER: Key conversion ============
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function mapKeys(obj: any, convert: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => mapKeys(item, convert));
  if (typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[convert(key)] = mapKeys(obj[key], convert);
    }
    return result;
  }
  return obj;
}

function sanitizeString(str: any): string { return typeof str === "string" ? str : ""; }

function mapJobToFrontend(j: any) {
  if (!j) return j;
  return {
    id: j.id,
    title: j.title,
    department: j.department,
    institution: j.institution,
    location: j.location,
    description: j.description,
    requirements: Array.isArray(j.requirements) ? j.requirements : (typeof j.requirements === "string" ? JSON.parse(j.requirements) : []),
    type: j.type,
    isActive: j.is_active !== undefined ? j.is_active : (j.isactive !== undefined ? j.isactive : true),
    createdAt: j.created_at || j.createdAt,
    imageUrl: j.image_url || j.imageUrl
  };
}

function mapUserToFrontend(u: any) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName || u.full_name || "",
    role: u.role,
    title: u.title || "",
    phone: u.phone || "",
    createdAt: u.createdAt || u.created_at || ""
  };
}

const memorySystemLogs: any[] = [];

async function writeLog(actor: string, op: string, details: string) {
  const entry = { id: `log-${Date.now()}`, actor, operation: op, details, timestamp: new Date().toISOString() };
  memorySystemLogs.unshift(entry);
  try { if (sbClient) await sbClient.from("system_logs").insert([entry]); } catch {}
}

// ============ IN-MEMORY SEEDED DATA ============
function seededUsers(): any[] {
  return [
    { id: "user-1", email: "michealangelo.canlas@cardmri.com", fullName: "Admin", password: "$2a$12$9SBtmC4Q/JndJzLbxF6UsOp5heVkH0jMu3dzBtMTuFRGK8wKtykd2", role: "it_admin", title: "IT Administrator", phone: "+63 918 100 2000" }
  ];
}
function seededJobs(): any[] {
  return [
    { id: "job-bmf-001", title: "Branch Microfinance Officer", department: "Branch Operations", institution: "CARD Bank, Inc.", location: "San Pablo City, Laguna", description: "Responsible for loan evaluations, conducting interviews, client orientations, and facilitating field disbursements.", requirements: ["Graduate of any 4-year Bachelor's Degree", "Willing to travel and do field work", "Strong communication skills", "Values integrity and has a heart for poverty eradication"], type: "Full-time", is_active: true, created_at: new Date("2026-01-15").toISOString() },
    { id: "job-fin-001", title: "Accountant / Finance Specialist", department: "Finance Center", institution: "CARD SME Bank, Inc.", location: "Lucena City, Quezon", description: "Handles bank reconciliation, monitors cash flow, ensures local tax compliance.", requirements: ["BS Accountancy Graduate", "At least 1-2 years experience in finance", "Highly meticulous and accurate", "Proficient in accounting software"], type: "Full-time", is_active: true, created_at: new Date("2026-02-01").toISOString() },
    { id: "job-it-001", title: "IT Support & System Specialist", department: "Information Technology Unit", institution: "CARD MRI IT Mutual Benefit Association", location: "Bay, Laguna", description: "Maintains network firewalls, handles hardware setups, supports digital apps.", requirements: ["BS Information Technology or Computer Science", "Knowledge in Linux or network subnetting", "Willing to offer tech support on field", "Good communication and problem-solving skills"], type: "Full-time", is_active: true, created_at: new Date("2026-03-10").toISOString() },
    { id: "job-hr-001", title: "Recruitment Coordinator & HR Generalist", department: "Human Resource Development", institution: "CARD Mutually Reinforcing Institutions", location: "San Pablo City, Laguna", description: "Aids in resume sorting, manages applicant files, coordinates evaluations.", requirements: ["BS Psychology or Human Resource", "Excellent organization abilities", "Interest in digitized workflows", "Outstanding communication skills"], type: "Full-time", is_active: true, created_at: new Date("2026-04-05").toISOString() }
  ];
}
function seededScreeningQuestions(): any[] {
  return [
    { id: "q-1", text: "Where did you hear about this career opportunity?", type: "select", options: ["Social Media", "School Job Fair", "Employee Referral", "Newspaper/Flyer", "Walk-in"], required: true, isActive: true, sort_order: 1 },
    { id: "q-2", text: "Are you willing to be assigned to any branch or field office matching CARD MRI priorities?", type: "boolean", options: [], required: true, isActive: true, sort_order: 2 },
    { id: "q-3", text: "Are you related to any active employee of CARD MRI entities up to the third degree of consanguinity or affinity?", type: "boolean", options: [], required: true, isActive: true, sort_order: 3 },
    { id: "q-4", text: "Do you have experience in field-based operations, collection, or community service work?", type: "boolean", options: [], required: true, isActive: true, sort_order: 4 }
  ];
}
function seededHomepageSettings(): any {
  return {
    id: 1,
    badgeText: "Empowering Countrysides via Intelligent Recruitment",
    title: "Build Your Career, Transform Filipino Lives",
    description: "Become part of the CARD Mutually Reinforcing Institutions legacy.",
    emergencyContacts: [
      { id: "1", label: "CARD MRI Central Office", value: "20 M. L. Quezon St., City of San Pablo, Laguna" },
      { id: "2", label: "HRD Hotlines", value: "+63 (2) 584-3333 ext 403" },
      { id: "3", label: "Digital Helpline Email", value: "mri_recruitment@cardmri.com" }
    ],
    branchesCount: "200+",
    yearsOfService: "35+",
    filipinosEmpowered: "5M+",
    heroImageUrl: ""
  };
}
function seededAboutSettings(): any {
  return {
    id: 1,
    missionText: "To provide responsive banking and financial services to the marginalized sectors of society.",
    visionText: "A nation where rural families are empowered through accessible financial services.",
    contactAddress: "20 M. L. Quezon St., City of San Pablo, Laguna, Philippines",
    contactPhone: "+63 (2) 584-3333 extension line 403",
    contactEmail: "mri_recruitment@cardmri.com",
    moralCompassValues: [],
    legacyTimeline: [],
    institutionBranches: []
  };
}
function seededSystemSettings(): Record<string, any[]> {
  return {
    statuses_list: ["New", "Acknowledge", "Passed Screening", "Already Endorsed", "Hired", "Rejected", "Rejected (With Relatives)"],
    institutions_list: ["CARD Bank", "CARD SME Bank", "CARD MBA", "CARD MRI IT", "CARD NGO", "CARD Pioneer", "CARD Leasing", "CARD Livelihood", "HR Department", "Finance Center", "IT Admin Unit", "Branch Operations"],
    hr_incharges_list: ["Ms. Ailen Entero", "Ms. Mary Jane Romero", "Mr. Edmon Bazar", "Ms. Sarah Balazo", "Ms. Christine Ramos", "Mr. Juan Dela Cruz", "Ms. Maria Santos", "Mr. Robert Lim"]
  };
}

const memoryUsers: any[] = persistedData.users || seededUsers();
const memoryJobs: any[] = persistedData.jobs || seededJobs();
const memoryApplications: any[] = persistedData.applications || [];
const memoryScreeningQuestions: any[] = persistedData.screeningQuestions || seededScreeningQuestions();
const memoryHomepageSettings: any = persistedData.homepageSettings || seededHomepageSettings();
const memoryAboutSettings: any = persistedData.aboutSettings || seededAboutSettings();
const memorySystemSettings: Record<string, any[]> = persistedData.systemSettings || seededSystemSettings();

// ============ ROUTES ============

app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));

// ---------- JOBS ----------
app.get("/api/jobs", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("jobs").select("*").order("created_at", { ascending: false });
      if (!error && data) return res.json(data.map(mapJobToFrontend));
    }
  } catch {}
  res.json(memoryJobs.map(mapJobToFrontend));
});

app.post("/api/jobs", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const job = {
      id: `job-${Date.now()}`,
      title: req.body.title,
      department: req.body.department,
      institution: req.body.institution,
      location: req.body.location,
      description: req.body.description,
      requirements: req.body.requirements || [],
      type: req.body.type || "Full-time",
      is_active: req.body.isActive !== undefined ? req.body.isActive : true,
      created_at: new Date().toISOString()
    };
    if (sbClient) {
      const { error } = await sbClient.from("jobs").insert([job]);
      if (error) throw new Error(error.message);
    }
    memoryJobs.push(job);
    savePersistedData("jobs", memoryJobs);
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Create Job", `Created job: ${job.title}`);
    res.json({ message: "Job created", job: mapJobToFrontend(job) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/jobs/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const updates: any = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.department !== undefined) updates.department = req.body.department;
    if (req.body.institution !== undefined) updates.institution = req.body.institution;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.requirements !== undefined) updates.requirements = req.body.requirements;
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
    updates.updated_at = new Date().toISOString();

    if (sbClient) {
      const { error } = await sbClient.from("jobs").update(updates).eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryJobs.findIndex((j: any) => j.id === req.params.id);
    if (idx !== -1) {
      memoryJobs[idx] = { ...memoryJobs[idx], ...updates };
      savePersistedData("jobs", memoryJobs);
    }
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Update Job", `Updated job: ${req.params.id}`);
    res.json({ message: "Job updated", job: mapJobToFrontend(idx !== -1 ? memoryJobs[idx] : updates) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/jobs/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    if (sbClient) {
      const { error } = await sbClient.from("jobs").delete().eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryJobs.findIndex((j: any) => j.id === req.params.id);
    if (idx !== -1) { memoryJobs.splice(idx, 1); savePersistedData("jobs", memoryJobs); }
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Delete Job", `Deleted job: ${req.params.id}`);
    res.json({ message: "Job deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- AUTH ----------
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

// ---------- USERS ----------
app.get("/api/users", async (req: any, res: any) => {
  if (!checkAdmin(req, res)) return;
  try {
    let users: any[] = [];
    try { if (sbClient) { const { data } = await sbClient.from("users").select("*"); if (data) users = data; } } catch {}
    if (users.length === 0) users = memoryUsers;
    res.json(users.map(mapUserToFrontend));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/users", async (req: any, res: any) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { email, fullName, phone, role, title, password, actorName } = req.body;
    if (!email || !fullName || !password) { res.status(400).json({ error: "Email, fullName, and password required" }); return; }
    const hashed = await bcrypt.hash(password, 12);
    const user = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      phone: phone || "",
      role: role || "recruiter",
      title: title || "Staff Officer",
      password: hashed,
      createdAt: new Date().toISOString()
    };
    if (sbClient) {
      const { error } = await sbClient.from("users").insert([user]);
      if (error) throw new Error(error.message);
    }
    memoryUsers.push(user);
    savePersistedData("users", memoryUsers);
    await writeLog(actorName || req.user?.fullName || req.user?.email, "Create User", `Created user: ${user.email}`);
    res.json({ message: "User created", user: mapUserToFrontend(user) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/users/:id", async (req: any, res: any) => {
  if (!checkAdmin(req, res)) return;
  try {
    const updates: any = {};
    if (req.body.fullName !== undefined) updates.fullName = req.body.fullName;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 12);

    if (sbClient) {
      const { error } = await sbClient.from("users").update(updates).eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryUsers.findIndex((u: any) => u.id === req.params.id);
    if (idx !== -1) {
      memoryUsers[idx] = { ...memoryUsers[idx], ...updates };
      savePersistedData("users", memoryUsers);
    }
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Update User", `Updated user: ${req.params.id}`);
    res.json({ message: "User updated", user: mapUserToFrontend(idx !== -1 ? memoryUsers[idx] : updates) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/users/:id", async (req: any, res: any) => {
  if (!checkAdmin(req, res)) return;
  try {
    const actorName = req.query.actorName || req.body?.actorName || req.user?.fullName || req.user?.email;
    if (sbClient) {
      const { error } = await sbClient.from("users").delete().eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryUsers.findIndex((u: any) => u.id === req.params.id);
    if (idx !== -1) { memoryUsers.splice(idx, 1); savePersistedData("users", memoryUsers); }
    await writeLog(actorName, "Delete User", `Deleted user: ${req.params.id}`);
    res.json({ message: "User deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SCREENING QUESTIONS ----------
app.get("/api/screening-questions", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("screening_questions").select("*").order("sort_order");
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memoryScreeningQuestions);
});

app.post("/api/screening-questions", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const q = {
      id: `q-${Date.now()}`,
      text: req.body.text,
      type: req.body.type || "boolean",
      options: req.body.options || [],
      required: req.body.required !== undefined ? req.body.required : true,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      sort_order: req.body.sort_order || 0
    };
    if (sbClient) {
      const dbPayload = { ...q, is_active: q.isActive, sort_order: q.sort_order };
      delete (dbPayload as any).isActive;
      const { error } = await sbClient.from("screening_questions").insert([dbPayload]);
      if (error) throw new Error(error.message);
    }
    memoryScreeningQuestions.push(q);
    savePersistedData("screeningQuestions", memoryScreeningQuestions);
    await writeLog(req.user?.fullName || req.user?.email, "Create Question", `Created screening question: ${q.text}`);
    res.json({ message: "Question created", question: q });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/screening-questions/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const updates: any = {};
    if (req.body.text !== undefined) updates.text = req.body.text;
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.options !== undefined) updates.options = req.body.options;
    if (req.body.required !== undefined) updates.required = req.body.required;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
    if (req.body.sort_order !== undefined) updates.sort_order = req.body.sort_order;

    if (sbClient) {
      const { error } = await sbClient.from("screening_questions").update(updates).eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryScreeningQuestions.findIndex((q: any) => q.id === req.params.id);
    if (idx !== -1) {
      memoryScreeningQuestions[idx] = { ...memoryScreeningQuestions[idx], ...req.body };
      savePersistedData("screeningQuestions", memoryScreeningQuestions);
    }
    await writeLog(req.user?.fullName || req.user?.email, "Update Question", `Updated screening question: ${req.params.id}`);
    res.json({ message: "Question updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/screening-questions/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    if (sbClient) {
      const { error } = await sbClient.from("screening_questions").delete().eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryScreeningQuestions.findIndex((q: any) => q.id === req.params.id);
    if (idx !== -1) { memoryScreeningQuestions.splice(idx, 1); savePersistedData("screeningQuestions", memoryScreeningQuestions); }
    await writeLog(req.user?.fullName || req.user?.email, "Delete Question", `Deleted screening question: ${req.params.id}`);
    res.json({ message: "Question deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- APPLICATIONS ----------
app.get("/api/applications", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  let dbApps: any[] = [];
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("applicants").select("*").order("created_at", { ascending: false });
      if (!error && data) dbApps = data;
    }
  } catch {}
  const seen = new Set(dbApps.map((a: any) => a.id));
  for (const mem of memoryApplications) {
    if (!seen.has(mem.id)) {
      dbApps.push(mem);
    }
  }
  res.json(dbApps);
});

// Returns only in-memory applications (for frontend supplement)
app.get("/api/api-only-applications", (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  res.json(memoryApplications);
});

app.post("/api/applications", async (req: any, res: any) => {
  try {
    const body = req.body;
    const app: any = {
      id: `app-${Date.now()}`,
      applicant_id: body.applicant_id || "public-guest-generic",
      full_name: body.full_name || body.fullName || "",
      email: body.email || "",
      phone: body.phone || "",
      job_id: body.job_id || body.jobId || "",
      job_title: body.job_title || body.jobTitle || "",
      resume_file_name: body.resume_file_name || body.resumeFileName || "Profile_Screening_Form.pdf",
      resume_text: body.resume_text || body.resumeText || "",
      status: body.status || "New",
      age: body.age || null,
      civil_status: body.civil_status || body.civilStatus || "Single",
      address: body.address || "",
      education_level: body.education_level || body.educationLevel || "College Graduate",
      course_graduated: body.course_graduated || body.courseGraduated || null,
      screening_answers: body.screening_answers || body.screeningAnswers || [],
      endorsed_to: body.endorsed_to || body.endorsedTo || "",
      hr_incharge: body.hr_incharge || body.hrIncharge || "",
      remarks: body.remarks || "",
      ai_summary: body.ai_summary || {},
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    if (sbClient) {
      const { error } = await sbClient.from("applicants").insert([app]);
      if (error) console.warn("Supabase insert failed (falling back to memory):", error.message);
    }
    memoryApplications.unshift(app);
    savePersistedData("applications", memoryApplications);
    await writeLog(body.actorName || req.user?.fullName || req.user?.email, "Create Application", `Created application for: ${app.full_name}`);
    res.json({ message: "Application created", application: app });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/applications/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const body = req.body;
    const updates: any = {};
    if (body.fullName !== undefined) updates.full_name = body.fullName;
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.age !== undefined) updates.age = body.age;
    if (body.civilStatus !== undefined) updates.civil_status = body.civilStatus;
    if (body.civil_status !== undefined) updates.civil_status = body.civil_status;
    if (body.address !== undefined) updates.address = body.address;
    if (body.educationLevel !== undefined) updates.education_level = body.educationLevel;
    if (body.education_level !== undefined) updates.education_level = body.education_level;
    if (body.courseGraduated !== undefined) updates.course_graduated = body.courseGraduated;
    if (body.course_graduated !== undefined) updates.course_graduated = body.course_graduated;
    if (body.jobTitle !== undefined) updates.job_title = body.jobTitle;
    if (body.job_title !== undefined) updates.job_title = body.job_title;
    if (body.resumeText !== undefined) updates.resume_text = body.resumeText;
    if (body.resume_text !== undefined) updates.resume_text = body.resume_text;

    if (sbClient) {
      const { error } = await sbClient.from("applicants").update(updates).eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (idx !== -1) {
      memoryApplications[idx] = { ...memoryApplications[idx], ...updates };
      savePersistedData("applications", memoryApplications);
    }
    await writeLog(body.actorName || req.user?.fullName || req.user?.email, "Update Application", `Updated application: ${req.params.id}`);
    res.json({ message: "Application updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/applications/:id/status", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const { status, endorsedTo, hrIncharge, remarks, actorName } = req.body;
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (endorsedTo !== undefined) updates.endorsed_to = endorsedTo;
    if (hrIncharge !== undefined) updates.hr_incharge = hrIncharge;
    if (remarks !== undefined) updates.remarks = remarks;

    if (sbClient) {
      const { error } = await sbClient.from("applicants").update(updates).eq("id", req.params.id);
      if (error) console.warn("Supabase status update failed (falling back to memory):", error.message);
    }
    const idx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (idx !== -1) {
      memoryApplications[idx] = { ...memoryApplications[idx], ...updates };
      savePersistedData("applications", memoryApplications);
    }
    await writeLog(actorName || req.user?.fullName || req.user?.email, "Status Change", `Changed status for ${req.params.id} to ${status || "updated"}`);
    res.json({ message: "Status updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/applications/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const actorName = req.body?.actorName || req.query?.actorName || req.user?.fullName || req.user?.email;
    if (sbClient) {
      const { error } = await sbClient.from("applicants").delete().eq("id", req.params.id);
      if (error) throw new Error(error.message);
    }
    const idx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (idx !== -1) { memoryApplications.splice(idx, 1); savePersistedData("applications", memoryApplications); }
    await writeLog(actorName, "Delete Application", `Deleted application: ${req.params.id}`);
    res.json({ message: "Application deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SETTINGS ----------
app.get("/api/homepage-settings", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("homepage_settings").select("*").maybeSingle();
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memoryHomepageSettings);
});

app.put("/api/homepage-settings", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const body = req.body;
    const settings: any = {};
    if (body.badgeText !== undefined) settings.badge_text = body.badgeText;
    if (body.title !== undefined) settings.title = body.title;
    if (body.description !== undefined) settings.description = body.description;
    if (body.branchesCount !== undefined) settings.branches_count = body.branchesCount;
    if (body.yearsOfService !== undefined) settings.years_of_service = body.yearsOfService;
    if (body.filipinosEmpowered !== undefined) settings.filipinos_empowered = body.filipinosEmpowered;
    if (body.heroImageUrl !== undefined) settings.hero_image_url = body.heroImageUrl;
    if (body.emergencyContacts !== undefined) settings.emergency_contacts = body.emergencyContacts;

    if (sbClient) {
      const { data: existing } = await sbClient.from("homepage_settings").select("id").eq("id", 1).maybeSingle();
      if (existing) {
        const { error } = await sbClient.from("homepage_settings").update(settings).eq("id", 1);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sbClient.from("homepage_settings").insert([{ id: 1, ...settings }]);
        if (error) throw new Error(error.message);
      }
    }
    Object.assign(memoryHomepageSettings, body);
    savePersistedData("homepageSettings", memoryHomepageSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", "Updated homepage settings");
    res.json({ message: "Homepage settings updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/about-settings", async (_req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("about_settings").select("*").maybeSingle();
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memoryAboutSettings);
});

app.put("/api/about-settings", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const body = req.body;
    const settings: any = {};
    if (body.missionText !== undefined) settings.mission_text = body.missionText;
    if (body.visionText !== undefined) settings.vision_text = body.visionText;
    if (body.contactAddress !== undefined) settings.contact_address = body.contactAddress;
    if (body.contactPhone !== undefined) settings.contact_phone = body.contactPhone;
    if (body.contactEmail !== undefined) settings.contact_email = body.contactEmail;
    if (body.moralCompassValues !== undefined) settings.moral_compass_values = body.moralCompassValues;
    if (body.legacyTimeline !== undefined) settings.legacy_timeline = body.legacyTimeline;
    if (body.institutionBranches !== undefined) settings.institution_branches = body.institutionBranches;
    if (body.moral_compass_values !== undefined) settings.moral_compass_values = body.moral_compass_values;
    if (body.legacy_timeline !== undefined) settings.legacy_timeline = body.legacy_timeline;
    if (body.institution_branches !== undefined) settings.institution_branches = body.institution_branches;

    if (sbClient) {
      const { data: existing } = await sbClient.from("about_settings").select("id").eq("id", 1).maybeSingle();
      if (existing) {
        const { error } = await sbClient.from("about_settings").update(settings).eq("id", 1);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sbClient.from("about_settings").insert([{ id: 1, ...settings }]);
        if (error) throw new Error(error.message);
      }
    }
    Object.assign(memoryAboutSettings, body);
    savePersistedData("aboutSettings", memoryAboutSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", "Updated about settings");
    res.json({ message: "About settings updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/system-settings/:key", async (req: any, res: any) => {
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("system_settings").select("value").eq("key", req.params.key).maybeSingle();
      if (!error && data) return res.json({ value: data.value });
    }
  } catch {}
  const val = memorySystemSettings[req.params.key];
  res.json({ value: val || null });
});

app.put("/api/system-settings/:key", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const key = req.params.key;
    const { value } = req.body;
    if (sbClient) {
      const { error } = await sbClient.from("system_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    memorySystemSettings[key] = value;
    savePersistedData("systemSettings", memorySystemSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", `Updated system setting: ${key}`);
    res.json({ message: "Setting updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SYSTEM LOGS ----------
app.get("/api/system-logs", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    if (sbClient) {
      const { data, error } = await sbClient.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(200);
      if (!error && data) return res.json(data);
    }
  } catch {}
  res.json(memorySystemLogs);
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Express:", err);
  res.status(500).json({ error: err?.message || "Express error" });
});

export default app;
