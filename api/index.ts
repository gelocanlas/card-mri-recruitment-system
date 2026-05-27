let app: any;
try {
  app = require("../server").default || require("../server");
} catch (e: any) {
  const errorMsg = `ImportError: ${e.message}`;
  app = (req: any, res: any) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: errorMsg, stack: e.stack?.split("\n").slice(0, 5).join("\\n") }));
  };
}

export default app;
