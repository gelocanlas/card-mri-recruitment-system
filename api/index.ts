import express from "express";
import cors from "cors";
const app = express();

app.use(cors({ origin: (_o: any, cb: any) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Routes
app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));
app.get("/api/users", (_req: any, res: any) => res.json([{ id: 1, name: "test" }]));
app.get("/api/jobs", async (_req: any, res: any) => { res.json([{ id: 1 }]); });
app.get("/api/homepage-settings", async (_req: any, res: any) => { res.json({}); });
app.get("/api/screening-questions", async (_req: any, res: any) => { res.json([]); });
app.get("/api/about-settings", async (_req: any, res: any) => { res.json({}); });
app.get("/api/applications", async (_req: any, res: any) => { res.json([]); });

app.get("/api/system-settings/:key", async (req: any, res: any) => {
  res.json({ value: "test" });
});

app.post("/api/auth/login", async (req: any, res: any) => {
  res.json({ message: "login ok" });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown" });
});

export default app;
