import express from "express";

const app = express();

app.get("/api/health", (req: any, res: any) => {
  res.json({ status: "ok", path: req.url });
});

export default app;
