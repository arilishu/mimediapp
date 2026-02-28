// server/index.ts
import express from "express";
import * as Sentry from "@sentry/node";

// server/middleware/auth.ts
import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";

// server/routes.ts
import { createServer } from "node:http";
import { getAuth as getAuth2 } from "@clerk/express";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

// server/replit_integrations/audio/transcribe.ts
import OpenAI, { toFile } from "openai";
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
async function convertToWav(audioBuffer) {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);
  try {
    await writeFile(inputPath, audioBuffer);
    await new Promise((resolve2, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        inputPath,
        "-vn",
        "-f",
        "wav",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-acodec",
        "pcm_s16le",
        "-y",
        outputPath
      ]);
      ffmpeg.stderr.on("data", () => {
      });
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve2();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ffmpeg.on("error", reject);
    });
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {
    });
    await unlink(outputPath).catch(() => {
    });
  }
}
async function transcribeAudio(audioBuffer) {
  const wavBuffer = await convertToWav(audioBuffer);
  const file = await toFile(wavBuffer, "audio.wav");
  const response = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe"
  });
  return response.text;
}

// server/routes.ts
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
function generateShareCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
function requireAuth2(req, res) {
  const auth = getAuth2(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return auth.userId;
}
async function registerRoutes(app2) {
  app2.get("/api/children", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const userId = authUserId;
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
        isReadOnly: row.is_read_only
      }));
      return res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      return res.status(500).json({ error: "Failed to fetch children" });
    }
  });
  app2.get("/api/children/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      const userId = authUserId;
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
        isReadOnly: row.is_read_only
      });
    } catch (error) {
      console.error("Error fetching child:", error);
      return res.status(500).json({ error: "Failed to fetch child" });
    }
  });
  app2.post("/api/children", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { name, birthDate, sex, avatarIndex } = req.body;
      if (!name || !birthDate || !sex) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO children (id, owner_id, name, birth_date, sex, avatar_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, authUserId, name, birthDate, sex, avatarIndex ?? 0]
      );
      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date,
        sex: row.sex,
        avatarIndex: row.avatar_index,
        createdAt: row.created_at,
        ownerId: row.owner_id
      });
    } catch (error) {
      console.error("Error creating child:", error);
      return res.status(500).json({ error: "Failed to create child" });
    }
  });
  app2.put("/api/children/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      const { name, birthDate, sex, avatarIndex } = req.body;
      const accessCheck = await pool.query(
        `SELECT c.id FROM children c
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $2
         WHERE c.id = $1 AND (c.owner_id = $2 OR (ca.user_id = $2 AND ca.is_read_only = false))`,
        [id, authUserId]
      );
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not authorized to update this child" });
      }
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
        ownerId: row.owner_id
      });
    } catch (error) {
      console.error("Error updating child:", error);
      return res.status(500).json({ error: "Failed to update child" });
    }
  });
  app2.delete("/api/children/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      const ownerCheck = await pool.query(
        "SELECT id FROM children WHERE id = $1 AND owner_id = $2",
        [id, authUserId]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not authorized to delete this child" });
      }
      await pool.query("DELETE FROM medical_visits WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM vaccines WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM appointments WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM allergies WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM past_diseases WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM medications WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM share_codes WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM child_access WHERE child_id = $1", [id]);
      await pool.query("DELETE FROM children WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting child:", error);
      return res.status(500).json({ error: "Failed to delete child" });
    }
  });
  app2.get("/api/visits", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
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
        weight: row.weight ? parseFloat(row.weight) : void 0,
        height: row.height ? parseFloat(row.height) : void 0,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : void 0,
        notes: row.notes,
        createdAt: row.created_at
      }));
      return res.json(visits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      return res.status(500).json({ error: "Failed to fetch visits" });
    }
  });
  app2.post("/api/visits", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        weight: row.weight ? parseFloat(row.weight) : void 0,
        height: row.height ? parseFloat(row.height) : void 0,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : void 0,
        notes: row.notes,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating visit:", error);
      return res.status(500).json({ error: "Failed to create visit" });
    }
  });
  app2.put("/api/visits/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        weight: row.weight ? parseFloat(row.weight) : void 0,
        height: row.height ? parseFloat(row.height) : void 0,
        headCircumference: row.head_circumference ? parseFloat(row.head_circumference) : void 0,
        notes: row.notes,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating visit:", error);
      return res.status(500).json({ error: "Failed to update visit" });
    }
  });
  app2.delete("/api/visits/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM medical_visits WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting visit:", error);
      return res.status(500).json({ error: "Failed to delete visit" });
    }
  });
  app2.get("/api/visit-photos", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const visitId = req.query.visitId;
      if (!visitId) return res.status(400).json({ error: "visitId required" });
      const result = await pool.query(
        "SELECT * FROM visit_photos WHERE visit_id = $1 ORDER BY created_at DESC",
        [visitId]
      );
      const photos = result.rows.map((row) => ({
        id: row.id,
        visitId: row.visit_id,
        photoData: row.photo_data,
        createdAt: row.created_at
      }));
      return res.json(photos);
    } catch (error) {
      console.error("Error fetching visit photos:", error);
      return res.status(500).json({ error: "Failed to fetch photos" });
    }
  });
  app2.post("/api/visit-photos", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { visitId, photoData } = req.body;
      if (!visitId || !photoData) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO visit_photos (id, visit_id, photo_data)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, visitId, photoData]
      );
      const row = result.rows[0];
      return res.json({
        id: row.id,
        visitId: row.visit_id,
        photoData: row.photo_data,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating visit photo:", error);
      return res.status(500).json({ error: "Failed to create photo" });
    }
  });
  app2.delete("/api/visit-photos/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM visit_photos WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting visit photo:", error);
      return res.status(500).json({ error: "Failed to delete photo" });
    }
  });
  app2.get("/api/vaccines", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
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
        createdAt: row.created_at
      }));
      return res.json(vaccines);
    } catch (error) {
      console.error("Error fetching vaccines:", error);
      return res.status(500).json({ error: "Failed to fetch vaccines" });
    }
  });
  app2.post("/api/vaccines", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating vaccine:", error);
      return res.status(500).json({ error: "Failed to create vaccine" });
    }
  });
  app2.post("/api/vaccines/batch", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      })));
    } catch (error) {
      console.error("Error creating vaccines:", error);
      return res.status(500).json({ error: "Failed to create vaccines" });
    }
  });
  app2.put("/api/vaccines/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating vaccine:", error);
      return res.status(500).json({ error: "Failed to update vaccine" });
    }
  });
  app2.delete("/api/vaccines/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM vaccines WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vaccine:", error);
      return res.status(500).json({ error: "Failed to delete vaccine" });
    }
  });
  app2.get("/api/appointments", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
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
        createdAt: row.created_at
      }));
      return res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.post("/api/appointments", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Failed to create appointment" });
    }
  });
  app2.put("/api/appointments/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      return res.status(500).json({ error: "Failed to update appointment" });
    }
  });
  app2.delete("/api/appointments/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM appointments WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      return res.status(500).json({ error: "Failed to delete appointment" });
    }
  });
  app2.get("/api/appointments/user/:userId", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const result = await pool.query(
        `SELECT a.*, c.name as child_name 
         FROM appointments a
         JOIN children c ON a.child_id = c.id
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $1
         WHERE (c.owner_id = $1 OR ca.user_id = $1)
           AND a.date::date >= CURRENT_DATE
         ORDER BY a.date::date ASC, a.time ASC
         LIMIT 5`,
        [authUserId]
      );
      const appointments = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        childName: row.child_name,
        doctorId: row.doctor_id,
        date: row.date,
        time: row.time,
        notes: row.notes,
        createdAt: row.created_at
      }));
      return res.json(appointments);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/vaccines/user/:userId", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const result = await pool.query(
        `SELECT v.*, c.name as child_name 
         FROM vaccines v
         JOIN children c ON v.child_id = c.id
         LEFT JOIN child_access ca ON c.id = ca.child_id AND ca.user_id = $1
         WHERE (c.owner_id = $1 OR ca.user_id = $1)
           AND v.is_applied = false
         ORDER BY c.name ASC, v.recommended_age ASC
         LIMIT 5`,
        [authUserId]
      );
      const vaccines = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        childName: row.child_name,
        name: row.name,
        recommendedAge: row.recommended_age,
        appliedDate: row.applied_date,
        isApplied: row.is_applied,
        createdAt: row.created_at
      }));
      return res.json(vaccines);
    } catch (error) {
      console.error("Error fetching user vaccines:", error);
      return res.status(500).json({ error: "Failed to fetch vaccines" });
    }
  });
  app2.get("/api/allergies", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
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
        createdAt: row.created_at
      }));
      return res.json(allergies);
    } catch (error) {
      console.error("Error fetching allergies:", error);
      return res.status(500).json({ error: "Failed to fetch allergies" });
    }
  });
  app2.post("/api/allergies", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating allergy:", error);
      return res.status(500).json({ error: "Failed to create allergy" });
    }
  });
  app2.put("/api/allergies/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating allergy:", error);
      return res.status(500).json({ error: "Failed to update allergy" });
    }
  });
  app2.delete("/api/allergies/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM allergies WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting allergy:", error);
      return res.status(500).json({ error: "Failed to delete allergy" });
    }
  });
  app2.get("/api/diseases", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
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
        createdAt: row.created_at
      }));
      return res.json(diseases);
    } catch (error) {
      console.error("Error fetching diseases:", error);
      return res.status(500).json({ error: "Failed to fetch diseases" });
    }
  });
  app2.post("/api/diseases", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating disease:", error);
      return res.status(500).json({ error: "Failed to create disease" });
    }
  });
  app2.put("/api/diseases/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating disease:", error);
      return res.status(500).json({ error: "Failed to update disease" });
    }
  });
  app2.delete("/api/diseases/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM past_diseases WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disease:", error);
      return res.status(500).json({ error: "Failed to delete disease" });
    }
  });
  app2.get("/api/doctors", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const result = await pool.query(
        "SELECT * FROM doctors WHERE owner_id = $1 ORDER BY name ASC",
        [authUserId]
      );
      const doctors = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        phone: row.phone,
        address: row.address,
        createdAt: row.created_at
      }));
      return res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });
  app2.post("/api/doctors", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { name, specialty, phone, address } = req.body;
      if (!name || !specialty) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO doctors (id, owner_id, name, specialty, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, authUserId, name, specialty, phone || "", address || ""]
      );
      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        phone: row.phone,
        address: row.address,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating doctor:", error);
      return res.status(500).json({ error: "Failed to create doctor" });
    }
  });
  app2.put("/api/doctors/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      const { name, specialty, phone, address } = req.body;
      const result = await pool.query(
        `UPDATE doctors SET name = COALESCE($2, name), specialty = COALESCE($3, specialty),
         phone = COALESCE($4, phone), address = COALESCE($5, address) WHERE id = $1 RETURNING *`,
        [id, name, specialty, phone, address]
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
        address: row.address,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating doctor:", error);
      return res.status(500).json({ error: "Failed to update doctor" });
    }
  });
  app2.delete("/api/doctors/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM doctors WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      return res.status(500).json({ error: "Failed to delete doctor" });
    }
  });
  app2.get("/api/medications", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const childId = req.query.childId;
      if (!childId) return res.status(400).json({ error: "childId required" });
      const result = await pool.query(
        "SELECT * FROM medications WHERE child_id = $1 ORDER BY created_at DESC",
        [childId]
      );
      const medications = result.rows.map((row) => ({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        symptom: row.symptom,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at
      }));
      return res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      return res.status(500).json({ error: "Failed to fetch medications" });
    }
  });
  app2.post("/api/medications", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { childId, name, symptom, dose, category, recommendedDose } = req.body;
      if (!childId || !name || !dose || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO medications (id, child_id, name, symptom, dose, category, recommended_dose)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, childId, name, symptom, dose, category, recommendedDose]
      );
      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        symptom: row.symptom,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating medication:", error);
      return res.status(500).json({ error: "Failed to create medication" });
    }
  });
  app2.put("/api/medications/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      const { name, symptom, dose, category, recommendedDose } = req.body;
      const result = await pool.query(
        `UPDATE medications SET name = COALESCE($2, name), symptom = $3, dose = COALESCE($4, dose),
         category = COALESCE($5, category), recommended_dose = COALESCE($6, recommended_dose)
         WHERE id = $1 RETURNING *`,
        [id, name, symptom, dose, category, recommendedDose]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Medication not found" });
      }
      const row = result.rows[0];
      return res.json({
        id: row.id,
        childId: row.child_id,
        name: row.name,
        symptom: row.symptom,
        dose: row.dose,
        category: row.category,
        recommendedDose: row.recommended_dose,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating medication:", error);
      return res.status(500).json({ error: "Failed to update medication" });
    }
  });
  app2.delete("/api/medications/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM medications WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting medication:", error);
      return res.status(500).json({ error: "Failed to delete medication" });
    }
  });
  app2.get("/api/hospitals", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const result = await pool.query(
        "SELECT * FROM hospitals WHERE owner_id = $1 ORDER BY name ASC",
        [authUserId]
      );
      const hospitals = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        specialties: row.specialties || [],
        createdAt: row.created_at
      }));
      return res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  });
  app2.post("/api/hospitals", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { name, address, phone, specialties } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO hospitals (id, owner_id, name, address, phone, specialties)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, authUserId, name, address, phone || "", specialties || []]
      );
      const row = result.rows[0];
      return res.json({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        specialties: row.specialties || [],
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error creating hospital:", error);
      return res.status(500).json({ error: "Failed to create hospital" });
    }
  });
  app2.put("/api/hospitals/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
        createdAt: row.created_at
      });
    } catch (error) {
      console.error("Error updating hospital:", error);
      return res.status(500).json({ error: "Failed to update hospital" });
    }
  });
  app2.delete("/api/hospitals/:id", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { id } = req.params;
      await pool.query("DELETE FROM hospitals WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hospital:", error);
      return res.status(500).json({ error: "Failed to delete hospital" });
    }
  });
  app2.post("/api/share-codes", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { childId, childName, childBirthDate, childSex, childAvatarIndex, isReadOnly } = req.body;
      if (!childId || !childName) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const existingResult = await pool.query(
        "SELECT * FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, authUserId]
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
          createdAt: existing.created_at
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
        [code, childId, authUserId, childName, childBirthDate, childSex, childAvatarIndex, isReadOnly ?? true]
      );
      const newCode = result.rows[0];
      return res.json({
        id: newCode.id.toString(),
        code: newCode.code,
        childId: newCode.child_id,
        ownerId: newCode.owner_id,
        isReadOnly: newCode.is_read_only,
        createdAt: newCode.created_at
      });
    } catch (error) {
      console.error("Error creating share code:", error);
      return res.status(500).json({ error: "Failed to create share code" });
    }
  });
  app2.get("/api/share-codes/:code", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const code = req.params.code;
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
        createdAt: shareCode.created_at
      });
    } catch (error) {
      console.error("Error fetching share code:", error);
      return res.status(500).json({ error: "Failed to fetch share code" });
    }
  });
  app2.delete("/api/share-codes/:childId", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { childId } = req.params;
      await pool.query(
        "DELETE FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, authUserId]
      );
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting share code:", error);
      return res.status(500).json({ error: "Failed to delete share code" });
    }
  });
  app2.patch("/api/share-codes/:childId", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { childId } = req.params;
      const { isReadOnly } = req.body;
      const result = await pool.query(
        "UPDATE share_codes SET is_read_only = $1 WHERE child_id = $2 AND owner_id = $3 RETURNING *",
        [isReadOnly, childId, authUserId]
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
        createdAt: shareCode.created_at
      });
    } catch (error) {
      console.error("Error updating share code:", error);
      return res.status(500).json({ error: "Failed to update share code" });
    }
  });
  app2.get("/api/share-codes/child/:childId", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { childId } = req.params;
      const result = await pool.query(
        "SELECT * FROM share_codes WHERE child_id = $1 AND owner_id = $2",
        [childId, authUserId]
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
        createdAt: shareCode.created_at
      });
    } catch (error) {
      console.error("Error fetching share code:", error);
      return res.status(500).json({ error: "Failed to fetch share code" });
    }
  });
  app2.post("/api/child-access", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
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
  app2.post("/api/transcribe", async (req, res) => {
    try {
      const authUserId = requireAuth2(req, res);
      if (!authUserId) return;
      const { audio } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "Audio data is required" });
      }
      const audioBuffer = Buffer.from(audio, "base64");
      const transcript = await transcribeAudio(audioBuffer);
      return res.json({ transcript });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  environment: process.env.NODE_ENV || "development"
});
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false, limit: "2mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    Sentry.captureException(err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && process.env.CLERK_DEV_SECRET_KEY) {
    process.env.CLERK_SECRET_KEY = process.env.CLERK_DEV_SECRET_KEY;
  }
  if (isDev && process.env.CLERK_DEV_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_DEV_PUBLISHABLE_KEY;
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  log(`Clerk [${isDev ? "dev" : "prod"}] secret: ${(process.env.CLERK_SECRET_KEY || "").substring(0, 15)}...`);
  log(`Clerk [${isDev ? "dev" : "prod"}] pubkey: ${(process.env.CLERK_PUBLISHABLE_KEY || "").substring(0, 15)}...`);
  app.use(clerkMiddleware());
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
