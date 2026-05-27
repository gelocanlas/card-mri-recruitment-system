import app from "../src/app";

// Debug catch-all to see what URL Express receives
app.use("/api/*", (req: any, res: any) => {
  res.json({
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    headers: {
      host: req.headers.host,
      "x-forwarded-proto": req.headers["x-forwarded-proto"],
    }
  });
});

export default app;
