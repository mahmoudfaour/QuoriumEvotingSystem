const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { computeVoterHash } = require('./crypto');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Auth & Election Service running' });
});

/* ========== AUTH ========== */

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ========== MIDDLEWARE ========== */

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token format' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ========== ELECTIONS ========== */

// GET /elections
app.get('/elections', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, description, start_time, end_time, is_active FROM elections ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Elections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /elections/:id/candidates
app.get('/elections/:id/candidates', authMiddleware, async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const result = await db.query(
      'SELECT id, name, description FROM candidates WHERE election_id = $1 ORDER BY id',
      [electionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Candidates error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ========== VOTE ========== */

// POST /elections/:id/vote  { candidateId }
app.post('/elections/:id/vote', authMiddleware, async (req, res) => {
  const electionId = parseInt(req.params.id, 10);
  const { candidateId } = req.body;
  const userId = req.user.userId;

  if (!electionId || !candidateId) {
    return res.status(400).json({ error: 'Missing electionId or candidateId' });
  }

  try {
    // 1) Check election active
    const electionRes = await db.query(
      'SELECT * FROM elections WHERE id = $1 AND is_active = TRUE',
      [electionId]
    );
    if (electionRes.rows.length === 0) {
      return res.status(400).json({ error: 'Election not active or not found' });
    }

    // 2) Check eligibility
    const eligibleRes = await db.query(
      'SELECT 1 FROM eligible_voters WHERE election_id = $1 AND user_id = $2',
      [electionId, userId]
    );
    if (eligibleRes.rows.length === 0) {
      return res.status(403).json({ error: 'Not eligible for this election' });
    }

    // 3) Local double vote check
    const statusRes = await db.query(
      'SELECT has_voted FROM local_vote_status WHERE election_id = $1 AND user_id = $2',
      [electionId, userId]
    );
    if (statusRes.rows.length > 0 && statusRes.rows[0].has_voted) {
      return res.status(400).json({ error: 'You have already voted (local check)' });
    }

    // 4) Compute voter hash
    const voterHash = computeVoterHash(userId, electionId);

    // 5) Call Gateway service -> blockchain
    const gatewayRes = await axios.post(`${GATEWAY_URL}/gateway/vote`, {
      electionId,
      candidateId,
      voterHash,
    });

    if (!gatewayRes.data.success) {
      console.error('Gateway response:', gatewayRes.data);
      return res.status(500).json({ error: 'Blockchain vote failed' });
    }

    // 6) Update local vote status
    if (statusRes.rows.length === 0) {
      await db.query(
        'INSERT INTO local_vote_status (election_id, user_id, has_voted) VALUES ($1, $2, TRUE)',
        [electionId, userId]
      );
    } else {
      await db.query(
        'UPDATE local_vote_status SET has_voted = TRUE WHERE election_id = $1 AND user_id = $2',
        [electionId, userId]
      );
    }

    res.json({
      success: true,
      message: 'Vote submitted successfully',
      txHash: gatewayRes.data.txHash,
    });
  } catch (err) {
    console.error('Vote flow error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Auth & Election Service listening on port ${PORT}`);
});

// ... existing requires at the top:
const adminRouter = require('./admin.routes');
const { requireAdmin } = require('./adminMiddleware');

// ... after app.use(express.json()) and after you define authMiddleware:
app.use('/admin', authMiddleware, requireAdmin, adminRouter);

// (keep your existing /auth/login, /elections, /elections/:id/candidates, /elections/:id/vote, etc.)

