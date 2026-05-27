import express from "express";
const app = express();
app.get("/api/users", (req: any, res: any) => {
  res.json({ message: "users ok", auth: req.headers.authorization });
});
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: err?.message || "Unknown" });
});
export default app;
