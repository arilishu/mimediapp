import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export { clerkMiddleware, requireAuth };

export function extractUserId(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  
  (req as any).userId = auth.userId;
  next();
}
