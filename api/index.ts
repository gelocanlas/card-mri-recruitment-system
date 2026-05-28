import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
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

// PostgreSQL connection via Aiven
const DATABASE_URL = process.env.DATABASE_URL || "";
let pgPool: any = null;
try { if (DATABASE_URL) pgPool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }); } catch (e: any) { console.warn("PG Pool:", e?.message); }

async function query(sql: string, params?: any[]): Promise<any[]> {
  if (!pgPool) return [];
  try { const r = await pgPool.query(sql, params); return r.rows; } catch (e: any) { console.warn("PG query:", e.message); return []; }
}
async function queryOne(sql: string, params?: any[]): Promise<any> {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
async function execute(sql: string, params?: any[]): Promise<boolean> {
  if (!pgPool) return false;
  try { await pgPool.query(sql, params); return true; } catch (e: any) { console.warn("PG execute:", e.message); return false; }
}

function toJson(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") try { return JSON.parse(val); } catch { return val; }
  return val;
}

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

function mapJobToFrontend(j: any) {
  if (!j) return j;
  return {
    id: j.id,
    title: j.title,
    department: j.department,
    institution: j.institution,
    location: j.location,
    description: j.description,
    requirements: toJson(j.requirements),
    type: j.type,
    isActive: j.is_active !== undefined ? j.is_active : true,
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
  const id = `log-${Date.now()}`;
  const ts = new Date().toISOString();
  const entry = { id, actor, operation: op, details, timestamp: ts };
  memorySystemLogs.unshift(entry);
  await execute("INSERT INTO public.system_logs (id, actor, operation, details, timestamp) VALUES ($1,$2,$3,$4,$5)", [id, actor, op, details, ts]);
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

app.get("/api/debug/db", async (_req: any, res: any) => {
  const info: any = { hasUrl: !!process.env.DATABASE_URL, poolExists: !!pgPool, urlPrefix: (process.env.DATABASE_URL || "").slice(0, 20), tests: {} };
  try {
    if (!pgPool) { info.tests.ping = "no pool"; }
    else {
      const r = await pgPool.query("SELECT 1 as ok");
      info.tests.ping = r.rows.length > 0 ? "ok" : "empty";
    }
  } catch (e: any) { info.tests.ping = "error: " + e.message; }
  try {
    if (pgPool) {
      const r = await pgPool.query("SELECT count(*)::int as cnt FROM public.jobs");
      info.tests.jobs = r.rows.length > 0 ? r.rows[0].cnt : "no rows";
    }
  } catch (e: any) { info.tests.jobs = "error: " + e.message; }
  res.json(info);
});

function mergeMemory(dbItems: any[], memItems: any[]): any[] {
  const memById: Record<string, any> = {};
  for (const m of memItems) memById[m.id] = m;
  const result: any[] = dbItems.map(d => memById[d.id] ? (delete memById[d.id], memById[d.id]) : d);
  for (const id of Object.keys(memById)) result.push(memById[id]);
  return result;
}

// ---------- JOBS ----------
app.get("/api/jobs", async (_req: any, res: any) => {
  const dbJobs = await query("SELECT * FROM public.jobs ORDER BY created_at DESC");
  res.json(mergeMemory(dbJobs, memoryJobs).map(mapJobToFrontend));
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
    await execute(
      "INSERT INTO public.jobs (id,title,department,institution,location,description,requirements,type,is_active,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)",
      [job.id, job.title, job.department, job.institution, job.location, job.description, JSON.stringify(job.requirements), job.type, job.is_active, job.created_at]
    );
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
    if (req.body.requirements !== undefined) updates.requirements = JSON.stringify(req.body.requirements);
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
    updates.updated_at = new Date().toISOString();

    const setClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = $${idx++}`);
      vals.push(v);
    }
    if (setClauses.length > 0) {
      vals.push(req.params.id);
      await execute(`UPDATE public.jobs SET ${setClauses.join(", ")} WHERE id = $${idx}`, vals);
    }
    const memIdx = memoryJobs.findIndex((j: any) => j.id === req.params.id);
    if (memIdx !== -1) {
      memoryJobs[memIdx] = { ...memoryJobs[memIdx], ...updates };
      savePersistedData("jobs", memoryJobs);
    }
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Update Job", `Updated job: ${req.params.id}`);
    res.json({ message: "Job updated", job: mapJobToFrontend(memIdx !== -1 ? memoryJobs[memIdx] : updates) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/jobs/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    await execute("DELETE FROM public.jobs WHERE id = $1", [req.params.id]);
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
    let dbUser: any = await queryOne("SELECT * FROM public.users WHERE LOWER(email) = LOWER($1)", [email]);
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
    const dbUsers = await query("SELECT * FROM public.users");
    res.json(mergeMemory(dbUsers, memoryUsers).map(mapUserToFrontend));
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
    await execute(
      "INSERT INTO public.users (id,email,\"fullName\",phone,role,title,password,\"createdAt\") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [user.id, user.email, user.fullName, user.phone, user.role, user.title, user.password, user.createdAt]
    );
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

    const setClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`"${k}" = $${idx++}`);
      vals.push(v);
    }
    if (setClauses.length > 0) {
      vals.push(req.params.id);
      await execute(`UPDATE public.users SET ${setClauses.join(", ")} WHERE id = $${idx}`, vals);
    }
    const memIdx = memoryUsers.findIndex((u: any) => u.id === req.params.id);
    if (memIdx !== -1) {
      memoryUsers[memIdx] = { ...memoryUsers[memIdx], ...updates };
      savePersistedData("users", memoryUsers);
    }
    await writeLog(req.body.actorName || req.user?.fullName || req.user?.email, "Update User", `Updated user: ${req.params.id}`);
    res.json({ message: "User updated", user: mapUserToFrontend(memIdx !== -1 ? memoryUsers[memIdx] : updates) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/users/:id", async (req: any, res: any) => {
  if (!checkAdmin(req, res)) return;
  try {
    const actorName = req.query.actorName || req.body?.actorName || req.user?.fullName || req.user?.email;
    await execute("DELETE FROM public.users WHERE id = $1", [req.params.id]);
    const idx = memoryUsers.findIndex((u: any) => u.id === req.params.id);
    if (idx !== -1) { memoryUsers.splice(idx, 1); savePersistedData("users", memoryUsers); }
    await writeLog(actorName, "Delete User", `Deleted user: ${req.params.id}`);
    res.json({ message: "User deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SCREENING QUESTIONS ----------
app.get("/api/screening-questions", async (_req: any, res: any) => {
  const dbQuestions = await query("SELECT * FROM public.screening_questions ORDER BY sort_order");
  res.json(mergeMemory(dbQuestions, memoryScreeningQuestions));
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
    await execute(
      "INSERT INTO public.screening_questions (id,text,type,options,required,is_active,sort_order) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)",
      [q.id, q.text, q.type, JSON.stringify(q.options), q.required, q.isActive, q.sort_order]
    );
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
    if (req.body.options !== undefined) updates.options = JSON.stringify(req.body.options);
    if (req.body.required !== undefined) updates.required = req.body.required;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
    if (req.body.sort_order !== undefined) updates.sort_order = req.body.sort_order;

    const setClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = $${idx++}`);
      vals.push(v);
    }
    if (setClauses.length > 0) {
      vals.push(req.params.id);
      await execute(`UPDATE public.screening_questions SET ${setClauses.join(", ")} WHERE id = $${idx}`, vals);
    }
    const memIdx = memoryScreeningQuestions.findIndex((q: any) => q.id === req.params.id);
    if (memIdx !== -1) {
      memoryScreeningQuestions[memIdx] = { ...memoryScreeningQuestions[memIdx], ...req.body };
      savePersistedData("screeningQuestions", memoryScreeningQuestions);
    }
    await writeLog(req.user?.fullName || req.user?.email, "Update Question", `Updated screening question: ${req.params.id}`);
    res.json({ message: "Question updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/screening-questions/:id", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    await execute("DELETE FROM public.screening_questions WHERE id = $1", [req.params.id]);
    const idx = memoryScreeningQuestions.findIndex((q: any) => q.id === req.params.id);
    if (idx !== -1) { memoryScreeningQuestions.splice(idx, 1); savePersistedData("screeningQuestions", memoryScreeningQuestions); }
    await writeLog(req.user?.fullName || req.user?.email, "Delete Question", `Deleted screening question: ${req.params.id}`);
    res.json({ message: "Question deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- APPLICATIONS ----------
app.get("/api/applications", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  const dbApps = await query("SELECT * FROM public.applicants ORDER BY created_at DESC");
  res.json(mergeMemory(dbApps, memoryApplications));
});

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
    await execute(
      "INSERT INTO public.applicants (id,applicant_id,full_name,email,phone,job_id,job_title,resume_file_name,resume_text,status,age,civil_status,address,education_level,course_graduated,screening_answers,endorsed_to,hr_incharge,remarks,ai_summary,applied_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$18,$19,$20::jsonb,$21,$22)",
      [app.id, app.applicant_id, app.full_name, app.email, app.phone, app.job_id, app.job_title, app.resume_file_name, app.resume_text, app.status, app.age, app.civil_status, app.address, app.education_level, app.course_graduated, JSON.stringify(app.screening_answers), app.endorsed_to, app.hr_incharge, app.remarks, JSON.stringify(app.ai_summary), app.applied_at, app.created_at]
    );
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

    const setClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = $${idx++}`);
      vals.push(v);
    }
    if (setClauses.length > 0) {
      vals.push(req.params.id);
      await execute(`UPDATE public.applicants SET ${setClauses.join(", ")} WHERE id = $${idx}`, vals);
    }
    const memIdx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (memIdx !== -1) {
      memoryApplications[memIdx] = { ...memoryApplications[memIdx], ...updates };
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

    const setClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = $${idx++}`);
      vals.push(v);
    }
    if (setClauses.length > 0) {
      vals.push(req.params.id);
      await execute(`UPDATE public.applicants SET ${setClauses.join(", ")} WHERE id = $${idx}`, vals);
    }
    const memIdx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (memIdx !== -1) {
      memoryApplications[memIdx] = { ...memoryApplications[memIdx], ...updates };
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
    await execute("DELETE FROM public.applicants WHERE id = $1", [req.params.id]);
    const idx = memoryApplications.findIndex((a: any) => a.id === req.params.id);
    if (idx !== -1) { memoryApplications.splice(idx, 1); savePersistedData("applications", memoryApplications); }
    await writeLog(actorName, "Delete Application", `Deleted application: ${req.params.id}`);
    res.json({ message: "Application deleted" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SETTINGS ----------
app.get("/api/homepage-settings", async (_req: any, res: any) => {
  let db: any = await queryOne("SELECT * FROM public.homepage_settings LIMIT 1");
  if (db) {
    res.json({
      id: db.id,
      badgeText: db.badge_text,
      title: db.title,
      description: db.description,
      emergencyContacts: toJson(db.emergency_contacts),
      branchesCount: db.branches_count,
      yearsOfService: db.years_of_service,
      filipinosEmpowered: db.filipinos_empowered,
      heroImageUrl: db.hero_image_url
    });
  } else {
    res.json(memoryHomepageSettings);
  }
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
    if (body.emergencyContacts !== undefined) settings.emergency_contacts = JSON.stringify(body.emergencyContacts);

    const existing = await queryOne("SELECT id FROM public.homepage_settings WHERE id = 1");
    if (existing) {
      const setClauses: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(settings)) {
        setClauses.push(`${k} = $${idx++}`);
        vals.push(v);
      }
      if (setClauses.length > 0) {
        vals.push(new Date().toISOString());
        await execute(`UPDATE public.homepage_settings SET ${setClauses.join(", ")}, updated_at = $${idx} WHERE id = 1`, vals);
      }
    } else {
      await execute(
        "INSERT INTO public.homepage_settings (id,badge_text,title,description,branches_count,years_of_service,filipinos_empowered,hero_image_url,emergency_contacts) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
        [settings.badge_text, settings.title, settings.description, settings.branches_count, settings.years_of_service, settings.filipinos_empowered, settings.hero_image_url, settings.emergency_contacts]
      );
    }
    Object.assign(memoryHomepageSettings, body);
    savePersistedData("homepageSettings", memoryHomepageSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", "Updated homepage settings");
    res.json({ message: "Homepage settings updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/about-settings", async (_req: any, res: any) => {
  let db: any = await queryOne("SELECT * FROM public.about_settings LIMIT 1");
  if (db) {
    res.json({
      id: db.id,
      missionText: db.mission_text,
      visionText: db.vision_text,
      contactAddress: db.contact_address,
      contactPhone: db.contact_phone,
      contactEmail: db.contact_email,
      moralCompassValues: toJson(db.moral_compass_values),
      legacyTimeline: toJson(db.legacy_timeline),
      institutionBranches: toJson(db.institution_branches)
    });
  } else {
    res.json(memoryAboutSettings);
  }
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
    if (body.moralCompassValues !== undefined) settings.moral_compass_values = JSON.stringify(body.moralCompassValues);
    if (body.legacyTimeline !== undefined) settings.legacy_timeline = JSON.stringify(body.legacyTimeline);
    if (body.institutionBranches !== undefined) settings.institution_branches = JSON.stringify(body.institutionBranches);
    if (body.moral_compass_values !== undefined) settings.moral_compass_values = JSON.stringify(body.moral_compass_values);
    if (body.legacy_timeline !== undefined) settings.legacy_timeline = JSON.stringify(body.legacy_timeline);
    if (body.institution_branches !== undefined) settings.institution_branches = JSON.stringify(body.institution_branches);

    const existing = await queryOne("SELECT id FROM public.about_settings WHERE id = 1");
    if (existing) {
      const setClauses: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(settings)) {
        setClauses.push(`${k} = $${idx++}`);
        vals.push(v);
      }
      if (setClauses.length > 0) {
        vals.push(new Date().toISOString());
        await execute(`UPDATE public.about_settings SET ${setClauses.join(", ")}, updated_at = $${idx} WHERE id = 1`, vals);
      }
    } else {
      await execute(
        "INSERT INTO public.about_settings (id,mission_text,vision_text,contact_address,contact_phone,contact_email,moral_compass_values,legacy_timeline,institution_branches) VALUES (1,$1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb)",
        [settings.mission_text, settings.vision_text, settings.contact_address, settings.contact_phone, settings.contact_email, settings.moral_compass_values, settings.legacy_timeline, settings.institution_branches]
      );
    }
    Object.assign(memoryAboutSettings, body);
    savePersistedData("aboutSettings", memoryAboutSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", "Updated about settings");
    res.json({ message: "About settings updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/system-settings/:key", async (req: any, res: any) => {
  let dbVal: any = null;
  const dbRow = await queryOne("SELECT value FROM public.system_settings WHERE key = $1", [req.params.key]);
  if (dbRow) dbVal = toJson(dbRow.value);
  const memVal = memorySystemSettings[req.params.key];
  res.json({ value: dbVal !== null ? dbVal : memVal });
});

app.put("/api/system-settings/:key", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  try {
    const key = req.params.key;
    const { value } = req.body;
    await execute(
      "INSERT INTO public.system_settings (key, value, updated_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = $3",
      [key, JSON.stringify(value), new Date().toISOString()]
    );
    memorySystemSettings[key] = value;
    savePersistedData("systemSettings", memorySystemSettings);
    await writeLog(req.user?.fullName || req.user?.email, "Update Settings", `Updated system setting: ${key}`);
    res.json({ message: "Setting updated" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------- SYSTEM LOGS ----------
app.get("/api/system-logs", async (req: any, res: any) => {
  if (!checkAuth(req, res)) return;
  const dbLogs = await query("SELECT * FROM public.system_logs ORDER BY timestamp DESC LIMIT 200");
  res.json(mergeMemory(dbLogs, memorySystemLogs));
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Express:", err);
  res.status(500).json({ error: err?.message || "Express error" });
});

export default app;
