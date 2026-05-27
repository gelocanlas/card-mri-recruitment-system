import expressApp from "../server";

export default function handler(req: any, res: any) {
  return expressApp(req, res);
}
