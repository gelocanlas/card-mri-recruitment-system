import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import app from "./api/index";

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CARD MRI SECURE INGRESS ENGINE] Server running on http://localhost:${PORT}`);
  });
}

// Only start the server when run directly (not imported by Vercel serverless runtime)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
