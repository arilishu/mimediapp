import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

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
  // ==================== CHILDREN ====================
  app.get("/api/children", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });

      // Get owned children + shared children
      const result = await pool.query(
        `SELECT c.*, 
          CASE WHEN c.owner_id = $1 THEN false ELSE true END as is_shared,
          COALESCE(ca.is_read_only, false) as is_read_only
         FROM children c
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $1
         WHERE c.owner_id = $1 OR ca.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );

      const children = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date,
        sex: row.sex,
        avatarIndex: row.avatar_index,
        createdAt: row.created_at,
        ownerId: row.owner_id,
        isShared: row.is_shared,
        isReadOnly: row.is_read_only,
      }));

      return res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      return res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.get("/api/children/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      const result = await pool.query(
        `SELECT c.*, 
          CASE WHEN c.owner_id = $2 THEN false ELSE true END as is_shared,
          COALESCE(ca.is_read_only, false) as is_read_only
         FROM children c
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $2
         WHERE c.id = $1 AND (c.owner_id = $2 OR ca.user_id = $2)`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Child not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date,
        sex: row.sex,
        avatarIndex: row.avatar_index,
        createdAt: row.created_at,
        ownerId: row.owner_id,
        isShared: row.is_shared,
        isReadOnly: row.is_read_only,
      });
    } catch (error) {
      console.error("Error fetching child:", error);
      return res.status(500).json({ error: "Failed to fetch child" });
    }
  });

  app.post("/api/children", async (req: Request, res: Response) => {
    try {
      const { name, birthDate, sex, avatarIndex, ownerId } = req.body;
      if (!name || !birthDate || !sex || !ownerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO children (id, owner_id, name, birth_date, sex, avatar_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, ownerId, name, birthDate, sex, avatarIndex ?? 0]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date,
        sex: row.sex,
        avatarIndex: row.avatar_index,
        createdAt: row.created_at,
        ownerId: row.owner_id,
      });
    } catch (error) {
      console.error("Error creating child:", error);
      return res.status(500).json({ error: "Failed to create child" });
    }
  });

  app.put("/api/children/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, birthDate, sex, avatarIndex } = req.body;

      const result = await pool.query(
        `UPDATE children SET name = COALESCE($2, name), birth_date = COALESCE($3, birth_date),
         sex = COALESCE($4, sex), avatar_index = COALESCE($5, avatar_index)
         WHERE id = $1 RETURNING *`,
        [id, name, birthDate, sex, avatarIndex]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Child not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date,
        sex: row.sex,
        avatarIndex: row.avatar_index,
        createdAt: row.created_at,
        ownerId: row.owner_id,
      });
    } catch (error) {
      console.error("Error updating child:", error);
      return res.status(500).json({ error: "Failed to update child" });
    }
  });

  app.delete("/api/children/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM children WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting child:", error);
      return res.status(500).json({ error: "Failed to delete child" });
    }
  });

  // ==================== MEDICAL VISITS ====================
  app.get("/api/visits", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM medical_visits WHERE child_id = $1 ORDER BY date DESC",
        [childId]
      );

      const visits = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        weight: row.weight ? parseFloat(row.weight) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : undefined,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return res.json(visits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      return res.status(500).json({ error: "Failed to fetch visits" });
    }
  });

  app.post("/api/visits", async (req: Request, res: Response) => {
    try {
      const { childId, doctorId, date, weight, height, headCircumference, notes } = req.body;
      if (!childId || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO medical_visits (id, child_id, doctor_id, date, weight, height, head_circumference, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, childId, doctorId, date, weight, height, headCircumference, notes]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        weight: row.weight ? parseFloat(row.weight) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : undefined,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating visit:", error);
      return res.status(500).json({ error: "Failed to create visit" });
    }
  });

  app.put("/api/visits/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { doctorId, date, weight, height, headCircumference, notes } = req.body;

      const result = await pool.query(
        `UPDATE medical_visits SET doctor_id = COALESCE($2, doctor_id), date = COALESCE($3, date),
         weight = COALESCE($4, weight), height = COALESCE($5, height),
         head_circumference = COALESCE($6, head_circumference), notes = COALESCE($7, notes)
         WHERE id = $1 RETURNING *`,
        [id, doctorId, date, weight, height, headCircumference, notes]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Visit not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        weight: row.weight ? parseFloat(row.weight) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : undefined,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating visit:", error);
      return res.status(500).json({ error: "Failed to update visit" });
    }
  });

  app.delete("/api/visits/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM medical_visits WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting visit:", error);
      return res.status(500).json({ error: "Failed to delete visit" });
    }
  });

  // ==================== VACCINES ====================
  app.get("/api/vaccines", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM vaccines WHERE child_id = $1 ORDER BY created_at ASC",
        [childId]
      );

      const vaccines = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        recommendedAge: row.recommended_age,
        appliedDate: row.applied_date,
        isApplied: row.is_applied,
        createdAt: row.created_at,
      }));

      return res.json(vaccines);
    } catch (error) {
      console.error("Error fetching vaccines:", error);
      return res.status(500).json({ error: "Failed to fetch vaccines" });
    }
  });

  app.post("/api/vaccines", async (req: Request, res: Response) => {
    try {
      const { childId, name, recommendedAge, appliedDate, isApplied } = req.body;
      if (!childId || !name || !recommendedAge) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO vaccines (id, child_id, name, recommended_age, applied_date, is_applied)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, childId, name, recommendedAge, appliedDate, isApplied ?? false]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        recommendedAge: row.recommended_age,
        appliedDate: row.applied_date,
        isApplied: row.is_applied,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating vaccine:", error);
      return res.status(500).json({ error: "Failed to create vaccine" });
    }
  });

  app.post("/api/vaccines/batch", async (req: Request, res: Response) => {
    try {
      const { childId, vaccines } = req.body;
      if (!childId || !vaccines || !Array.isArray(vaccines)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const results = [];
      for (const vaccine of vaccines) {
        const id = uuidv4();
        const result = await pool.query(
          `INSERT INTO vaccines (id, child_id, name, recommended_age, is_applied)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [id, childId, vaccine.name, vaccine.recommendedAge, false]
        );
        results.push(result.rows[0]);
      }

      return res.json(results.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        recommendedAge: row.recommended_age,
        isApplied: row.is_applied,
        createdAt: row.created_at,
      })));
    } catch (error) {
      console.error("Error creating vaccines:", error);
      return res.status(500).json({ error: "Failed to create vaccines" });
    }
  });

  app.put("/api/vaccines/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { appliedDate, isApplied } = req.body;

      const result = await pool.query(
        `UPDATE vaccines SET applied_date = $2, is_applied = $3
         WHERE id = $1 RETURNING *`,
        [id, appliedDate, isApplied]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Vaccine not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        recommendedAge: row.recommended_age,
        appliedDate: row.applied_date,
        isApplied: row.is_applied,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating vaccine:", error);
      return res.status(500).json({ error: "Failed to update vaccine" });
    }
  });

  app.delete("/api/vaccines/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM vaccines WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vaccine:", error);
      return res.status(500).json({ error: "Failed to delete vaccine" });
    }
  });

  // ==================== APPOINTMENTS ====================
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM appointments WHERE child_id = $1 ORDER BY date DESC, time DESC",
        [childId]
      );

      const appointments = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        time: row.time,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      const { childId, doctorId, date, time, notes } = req.body;
      if (!childId || !date || !time) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO appointments (id, child_id, doctor_id, date, time, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, childId, doctorId, date, time, notes]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        time: row.time,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { doctorId, date, time, notes } = req.body;

      const result = await pool.query(
        `UPDATE appointments SET doctor_id = COALESCE($2, doctor_id), date = COALESCE($3, date),
         time = COALESCE($4, time), notes = COALESCE($5, notes)
         WHERE id = $1 RETURNING *`,
        [id, doctorId, date, time, notes]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        doctorId: row.doctor_id,
        date: row.date,
        time: row.time,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      return res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM appointments WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      return res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Get all upcoming appointments for a user (across all their children)
  app.get("/api/appointments/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: "userId required" });

      const result = await pool.query(
        `SELECT a.*, c.name as child_name 
         FROM appointments a
         JOIN children c ON a.child_id = c.id
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $1
         WHERE (c.owner_id = $1 OR ca.user_id = $1)
           AND a.date::date >= CURRENT_DATE
         ORDER BY a.date::date ASC, a.time ASC
         LIMIT 5`,
        [userId]
      );

      const appointments = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        childName: row.child_name,
        doctorId: row.doctor_id,
        date: row.date,
        time: row.time,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return res.json(appointments);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get all pending vaccines for a user (across all their children)
  app.get("/api/vaccines/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: "userId required" });

      const result = await pool.query(
        `SELECT v.*, c.name as child_name 
         FROM vaccines v
         JOIN children c ON v.child_id = c.id
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $1
         WHERE (c.owner_id = $1 OR ca.user_id = $1)
           AND v.is_applied = false
         ORDER BY c.name ASC, v.recommended_age ASC
         LIMIT 5`,
        [userId]
      );

      const vaccines = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        childName: row.child_name,
        name: row.name,
        recommendedAge: row.recommended_age,
        appliedDate: row.applied_date,
        isApplied: row.is_applied,
        createdAt: row.created_at,
      }));

      return res.json(vaccines);
    } catch (error) {
      console.error("Error fetching user vaccines:", error);
      return res.status(500).json({ error: "Failed to fetch vaccines" });
    }
  });

  // ==================== ALLERGIES ====================
  app.get("/api/allergies", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM allergies WHERE child_id = $1 ORDER BY created_at DESC",
        [childId]
      );

      const allergies = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        severity: row.severity,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return res.json(allergies);
    } catch (error) {
      console.error("Error fetching allergies:", error);
      return res.status(500).json({ error: "Failed to fetch allergies" });
    }
  });

  app.post("/api/allergies", async (req: Request, res: Response) => {
    try {
      const { childId, name, severity, notes } = req.body;
      if (!childId || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO allergies (id, child_id, name, severity, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, childId, name, severity, notes]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        severity: row.severity,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating allergy:", error);
      return res.status(500).json({ error: "Failed to create allergy" });
    }
  });

  app.put("/api/allergies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, severity, notes } = req.body;

      const result = await pool.query(
        `UPDATE allergies SET name = COALESCE($2, name), severity = COALESCE($3, severity),
         notes = COALESCE($4, notes) WHERE id = $1 RETURNING *`,
        [id, name, severity, notes]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Allergy not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        severity: row.severity,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating allergy:", error);
      return res.status(500).json({ error: "Failed to update allergy" });
    }
  });

  app.delete("/api/allergies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM allergies WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting allergy:", error);
      return res.status(500).json({ error: "Failed to delete allergy" });
    }
  });

  // ==================== PAST DISEASES ====================
  app.get("/api/diseases", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM past_diseases WHERE child_id = $1 ORDER BY date DESC",
        [childId]
      );

      const diseases = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        date: row.date,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return res.json(diseases);
    } catch (error) {
      console.error("Error fetching diseases:", error);
      return res.status(500).json({ error: "Failed to fetch diseases" });
    }
  });

  app.post("/api/diseases", async (req: Request, res: Response) => {
    try {
      const { childId, name, date, notes } = req.body;
      if (!childId || !name || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO past_diseases (id, child_id, name, date, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, childId, name, date, notes]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        date: row.date,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating disease:", error);
      return res.status(500).json({ error: "Failed to create disease" });
    }
  });

  app.put("/api/diseases/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, date, notes } = req.body;

      const result = await pool.query(
        `UPDATE past_diseases SET name = COALESCE($2, name), date = COALESCE($3, date),
         notes = COALESCE($4, notes) WHERE id = $1 RETURNING *`,
        [id, name, date, notes]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Disease not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        date: row.date,
        notes: row.notes,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating disease:", error);
      return res.status(500).json({ error: "Failed to update disease" });
    }
  });

  app.delete("/api/diseases/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM past_diseases WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disease:", error);
      return res.status(500).json({ error: "Failed to delete disease" });
    }
  });

  // ==================== DOCTORS ====================
  app.get("/api/doctors", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });

      const result = await pool.query(
        "SELECT * FROM doctors WHERE owner_id = $1 ORDER BY name ASC",
        [userId]
      );

      const doctors = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        phone: row.phone,
        createdAt: row.created_at,
      }));

      return res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors", async (req: Request, res: Response) => {
    try {
      const { name, specialty, phone, ownerId } = req.body;
      if (!name || !specialty || !ownerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO doctors (id, owner_id, name, specialty, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, ownerId, name, specialty, phone]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        phone: row.phone,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating doctor:", error);
      return res.status(500).json({ error: "Failed to create doctor" });
    }
  });

  app.put("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, specialty, phone } = req.body;

      const result = await pool.query(
        `UPDATE doctors SET name = COALESCE($2, name), specialty = COALESCE($3, specialty),
         phone = COALESCE($4, phone) WHERE id = $1 RETURNING *`,
        [id, name, specialty, phone]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        phone: row.phone,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating doctor:", error);
      return res.status(500).json({ error: "Failed to update doctor" });
    }
  });

  app.delete("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM doctors WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      return res.status(500).json({ error: "Failed to delete doctor" });
    }
  });

  // ==================== MEDICATIONS ====================
  app.get("/api/medications", async (req: Request, res: Response) => {
    try {
      const childId = req.query.childId as string;
      if (!childId) return res.status(400).json({ error: "childId required" });

      const result = await pool.query(
        "SELECT * FROM medications WHERE child_id = $1 ORDER BY created_at DESC",
        [childId]
      );

      const medications = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at,
      }));

      return res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      return res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req: Request, res: Response) => {
    try {
      const { childId, name, dose, category, recommendedDose } = req.body;
      if (!childId || !name || !dose || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO medications (id, child_id, name, dose, category, recommended_dose)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, childId, name, dose, category, recommendedDose]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating medication:", error);
      return res.status(500).json({ error: "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, dose, category, recommendedDose } = req.body;

      const result = await pool.query(
        `UPDATE medications SET name = COALESCE($2, name), dose = COALESCE($3, dose),
         category = COALESCE($4, category), recommended_dose = COALESCE($5, recommended_dose)
         WHERE id = $1 RETURNING *`,
        [id, name, dose, category, recommendedDose]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating medication:", error);
      return res.status(500).json({ error: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM medications WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting medication:", error);
      return res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // ==================== HOSPITALS ====================
  app.get("/api/hospitals", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });

      const result = await pool.query(
        "SELECT * FROM hospitals WHERE owner_id = $1 ORDER BY name ASC",
        [userId]
      );

      const hospitals = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        specialties: row.specialties || [],
        createdAt: row.created_at,
      }));

      return res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  });

  app.post("/api/hospitals", async (req: Request, res: Response) => {
    try {
      const { name, address, phone, specialties, ownerId } = req.body;
      if (!name || !address || !phone || !ownerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO hospitals (id, owner_id, name, address, phone, specialties)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, ownerId, name, address, phone, specialties || []]
      );

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        specialties: row.specialties || [],
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error creating hospital:", error);
      return res.status(500).json({ error: "Failed to create hospital" });
    }
  });

  app.put("/api/hospitals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, address, phone, specialties } = req.body;

      const result = await pool.query(
        `UPDATE hospitals SET name = COALESCE($2, name), address = COALESCE($3, address),
         phone = COALESCE($4, phone), specialties = COALESCE($5, specialties)
         WHERE id = $1 RETURNING *`,
        [id, name, address, phone, specialties]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Hospital not found" });
      }

      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        specialties: row.specialties || [],
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error("Error updating hospital:", error);
      return res.status(500).json({ error: "Failed to update hospital" });
    }
  });

  app.delete("/api/hospitals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM hospitals WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hospital:", error);
      return res.status(500).json({ error: "Failed to delete hospital" });
    }
  });

  // ==================== SHARE CODES ====================
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

  // ==================== CHILD ACCESS (for shared children) ====================
  app.post("/api/child-access", async (req: Request, res: Response) => {
    try {
      const { childId, userId, isReadOnly } = req.body;
      if (!childId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await pool.query(
        `INSERT INTO child_access (child_id, user_id, is_read_only)
         VALUES ($1, $2, $3)
         ON CONFLICT (child_id, user_id) DO UPDATE SET is_read_only = $3`,
        [childId, userId, isReadOnly ?? true]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error("Error creating child access:", error);
      return res.status(500).json({ error: "Failed to create child access" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
