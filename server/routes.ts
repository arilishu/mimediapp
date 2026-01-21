import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/share-codes", async (req: Request, res: Response) => {
    try {
      const { childId, ownerId, childName, childBirthDate, childSex, childAvatarIndex, isReadOnly } = req.body;

      if (!childId || !ownerId || !childName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingResult = await pool.query(
        "SELECT * FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, ownerId]
      );

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.is_read_only !== isReadOnly) {
          await pool.query(
            "UPDATE share_codes SET is_read_only = $1 WHERE id = $2",
            [isReadOnly, existing.id]
          );
          existing.is_read_only = isReadOnly;
        }
        return res.json({
          id: existing.id.toString(),
          code: existing.code,
          childId: existing.child_id,
          ownerId: existing.owner_id,
          isReadOnly: existing.is_read_only,
          createdAt: existing.created_at,
        });
      }

      let code = generateShareCode();
      let codeExists = true;
      while (codeExists) {
        const checkResult = await pool.query("SELECT id FROM share_codes WHERE code = $1", [code]);
        if (checkResult.rows.length === 0) {
          codeExists = false;
        } else {
          code = generateShareCode();
        }
      }

      const result = await pool.query(
        `INSERT INTO share_codes (code, child_id, owner_id, child_name, child_birth_date, child_sex, child_avatar_index, is_read_only)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [code, childId, ownerId, childName, childBirthDate, childSex, childAvatarIndex, isReadOnly ?? true]
      );

      const newCode = result.rows[0];
      return res.json({
        id: newCode.id.toString(),
        code: newCode.code,
        childId: newCode.child_id,
        ownerId: newCode.owner_id,
        isReadOnly: newCode.is_read_only,
        createdAt: newCode.created_at,
      });
    } catch (error) {
      console.error("Error creating share code:", error);
      return res.status(500).json({ error: "Failed to create share code" });
    }
  });

  app.get("/api/share-codes/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code as string;

      const result = await pool.query(
        "SELECT * FROM share_codes WHERE code = $1",
        [code.toUpperCase()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Share code not found" });
      }

      const shareCode = result.rows[0];
      return res.json({
        id: shareCode.id.toString(),
        code: shareCode.code,
        childId: shareCode.child_id,
        ownerId: shareCode.owner_id,
        childName: shareCode.child_name,
        childBirthDate: shareCode.child_birth_date,
        childSex: shareCode.child_sex,
        childAvatarIndex: shareCode.child_avatar_index,
        isReadOnly: shareCode.is_read_only,
        createdAt: shareCode.created_at,
      });
    } catch (error) {
      console.error("Error fetching share code:", error);
      return res.status(500).json({ error: "Failed to fetch share code" });
    }
  });

  app.delete("/api/share-codes/:childId", async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const { ownerId } = req.body;

      await pool.query(
        "DELETE FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, ownerId]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting share code:", error);
      return res.status(500).json({ error: "Failed to delete share code" });
    }
  });

  app.patch("/api/share-codes/:childId", async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const { ownerId, isReadOnly } = req.body;

      const result = await pool.query(
        "UPDATE share_codes SET is_read_only = $1 WHERE child_id = $2 AND owner_id = $3 RETURNING *",
        [isReadOnly, childId, ownerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Share code not found" });
      }

      const shareCode = result.rows[0];
      return res.json({
        id: shareCode.id.toString(),
        code: shareCode.code,
        childId: shareCode.child_id,
        ownerId: shareCode.owner_id,
        isReadOnly: shareCode.is_read_only,
        createdAt: shareCode.created_at,
      });
    } catch (error) {
      console.error("Error updating share code:", error);
      return res.status(500).json({ error: "Failed to update share code" });
    }
  });

  app.get("/api/share-codes/child/:childId", async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const ownerId = req.query.ownerId as string;

      const result = await pool.query(
        "SELECT * FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, ownerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Share code not found" });
      }

      const shareCode = result.rows[0];
      return res.json({
        id: shareCode.id.toString(),
        code: shareCode.code,
        childId: shareCode.child_id,
        ownerId: shareCode.owner_id,
        isReadOnly: shareCode.is_read_only,
        createdAt: shareCode.created_at,
      });
    } catch (error) {
      console.error("Error fetching share code:", error);
      return res.status(500).json({ error: "Failed to fetch share code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
