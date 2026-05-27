export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../server.ts");
    const app = mod.default || mod;
    await new Promise<void>((resolve, reject) => {
      app(req, res);
      res.on("finish", resolve);
      res.on("error", reject);
    });
  } catch (e: any) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: e?.message || "Unknown error",
      stack: (e?.stack || "").split("\n").slice(0, 5)
    }));
  }
}
