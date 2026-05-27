export default function handler(req: any, res: any) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
}
