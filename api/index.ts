import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Global unhandled rejection handler
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

const app = express();
app.use(cors({ origin: (_o: any, cb: any) => cb(null, true), credentials: true }));
app.use(express.json());

const JWT_SECRET = "test_secret";

app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));

app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);
    // Minimal test - just check bcrypt works
    const hash = await bcrypt.hash("testpassword", 4);
    const match = await bcrypt.compare("testpassword", hash);
    console.log("bcrypt works:", match);
    res.json({ success: true, bcryptWorks: match });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

app.get("/api/jwt-test", (req: any, res: any) => {
  try {
    const token = jwt.sign({ test: true }, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ token, decoded });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Express error:", err);
  res.status(500).json({ error: err?.message || "Express error" });
});

export default app;
