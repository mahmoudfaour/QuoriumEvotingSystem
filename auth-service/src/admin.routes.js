// auth-service/src/admin.routes.js
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');

const router = express.Router();

/* ===================== USERS ===================== */
/**
 * GET /admin/users?role=voter|admin (optional)
 * Returns list of users. Optional filter by role.
 */
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const q = role ? 'WHERE role = $1 ORDER BY id' : 'ORDER BY id';
    const params = role ? [role] : [];
    const r = await db.query(`SELECT id, full_name, email, role FROM users ${q}`, params);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /admin/users
 * Body: { full_name, email, password, role? = 'voter' }
 * Upserts by email.
 */
router.post('/users', async (req, res) => {
  try {
    const { full_name, email, password, role = 'voter' } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(
      `INSERT INTO users(full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role
       RETURNING id, full_name, email, role`,
      [full_name, email, hash, role]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /admin/users/:id
 * Body: { full_name?, email?, role?, password? }
 */
router.patch('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { full_name, email, role, password } = req.body;

    const fields = [];
    const vals = [];
    let i = 1;

    if (full_name) { fields.push(`full_name = $${i++}`); vals.push(full_name); }
    if (email)     { fields.push(`email = $${i++}`);     vals.push(email); }
    if (role)      { fields.push(`role = $${i++}`);      vals.push(role); }
    if (password)  { fields.push(`password_hash = $${i++}`); vals.push(await bcrypt.hash(password, 10)); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    vals.push(id);
    const r = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, full_name, email, role`,
      vals
    );
    if (!r.rowCount) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /admin/users/:id
 * Also cleans related local_vote_status and eligibility rows.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM local_vote_status WHERE user_id = $1', [id]);
    await db.query('DELETE FROM eligible_voters WHERE user_id = $1', [id]);
    const r = await db.query('DELETE FROM users WHERE id = $1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ===================== ELECTIONS ===================== */
/**
 * POST /admin/elections
 * Body: { title, description, start_time, end_time, is_active? = true }
 */
router.post('/elections', async (req, res) => {
  try {
    const { title, description = '', start_time, end_time, is_active = true } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const r = await db.query(
      `INSERT INTO elections (title, description, start_time, end_time, is_active)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, title, description, start_time, end_time, is_active`,
      [title, description, start_time, end_time, is_active]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /admin/elections
 */
router.get('/elections', async (_req, res) => {
  try {
    const r = await db.query(
      'SELECT id, title, description, start_time, end_time, is_active FROM elections ORDER BY id'
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /admin/elections/:id
 * Body: { title?, description?, start_time?, end_time?, is_active? }
 */
router.patch('/elections/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, start_time, end_time, is_active } = req.body;

    const fields = [], vals = []; let i = 1;
    if (title !== undefined)       { fields.push(`title = $${i++}`);       vals.push(title); }
    if (description !== undefined) { fields.push(`description = $${i++}`); vals.push(description); }
    if (start_time !== undefined)  { fields.push(`start_time = $${i++}`);  vals.push(start_time); }
    if (end_time !== undefined)    { fields.push(`end_time = $${i++}`);    vals.push(end_time); }
    if (is_active !== undefined)   { fields.push(`is_active = $${i++}`);   vals.push(is_active); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    vals.push(id);
    const r = await db.query(
      `UPDATE elections SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, title, description, start_time, end_time, is_active`,
      vals
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Election not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /admin/elections/:id
 * Also cleans candidates, local_vote_status, Eligible voters.
 */
router.delete('/elections/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM local_vote_status WHERE election_id = $1', [id]);
    await db.query('DELETE FROM eligible_voters WHERE election_id = $1', [id]);
    await db.query('DELETE FROM candidates WHERE election_id = $1', [id]);
    const r = await db.query('DELETE FROM elections WHERE id = $1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Election not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ===================== CANDIDATES ===================== */
/**
 * POST /admin/candidates
 * Body: { election_id, name, description? }
 */
router.post('/candidates', async (req, res) => {
  try {
    const { election_id, name, description = '' } = req.body;
    if (!election_id || !name) return res.status(400).json({ error: 'Missing fields' });

    const r = await db.query(
      `INSERT INTO candidates (election_id, name, description)
       VALUES ($1,$2,$3)
       RETURNING id, election_id, name, description`,
      [election_id, name, description]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /admin/candidates/:id
 */
router.delete('/candidates/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await db.query('DELETE FROM candidates WHERE id = $1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ===================== ELIGIBILITY ===================== */
/**
 * POST /admin/eligibility
 * Body: { election_id, user_id }
 */
router.post('/eligibility', async (req, res) => {
  try {
    const { election_id, user_id } = req.body;
    if (!election_id || !user_id) return res.status(400).json({ error: 'Missing fields' });

    await db.query(
      `INSERT INTO eligible_voters (election_id, user_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [election_id, user_id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /admin/eligibility
 * Body: { election_id, user_id }
 */
router.delete('/eligibility', async (req, res) => {
  try {
    const { election_id, user_id } = req.body;
    if (!election_id || !user_id) return res.status(400).json({ error: 'Missing fields' });

    await db.query('DELETE FROM eligible_voters WHERE election_id = $1 AND user_id = $2', [election_id, user_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
