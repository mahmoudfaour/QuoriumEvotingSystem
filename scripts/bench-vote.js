// scripts/bench.js
// npm i axios
const axios = require('axios');

// ======== CONFIG ========
const AUTH = process.env.AUTH_BASE || 'http://localhost:4000';
const ELECTION_ID   = Number(process.env.ELECTION_ID || 1);
const CANDIDATE_ID  = Number(process.env.CANDIDATE_ID || 1);
const VOTERS_COUNT  = Number(process.env.VOTERS_COUNT || 10);
const PARALLEL      = true; // set false to vote sequentially

// Admin creds (must exist in DB with role='admin')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uni.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Admin123!';

// Use SAME test password for all demo voters
const VOTER_PASS  = process.env.VOTER_PASS  || 'Voter123!';

// If you implemented an admin endpoint to clear local flags,
// set this true. Otherwise we'll skip that step.
const USE_RESET_LOCAL_STATUS = false;
// Endpoint suggestion (see note at bottom):
// POST /admin/reset-local-status { election_id }
// const RESET_ENDPOINT = `${AUTH}/admin/reset-local-status`;

// ======== GENERATED VOTERS ========
function makeVoters(n) {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    arr.push({
      full_name: `Student ${i}`,
      email:     `student${i}@uni.com`,
      password:  VOTER_PASS,
      role:      'voter'
    });
  }
  return arr;
}
const voters = makeVoters(VOTERS_COUNT);

// ======== HELPERS ========
async function apiPost(url, path, body, token) {
  const res = await axios.post(url + path, body, token ? {
    headers: { Authorization: `Bearer ${token}` }
  } : undefined);
  return res.data;
}
async function apiGet(url, path, token) {
  const res = await axios.get(url + path, token ? {
    headers: { Authorization: `Bearer ${token}` }
  } : undefined);
  return res.data;
}

// AUTH
async function login(email, password) {
  const out = await apiPost(AUTH, '/auth/login', { email, password });
  return out.token;
}

// ADMIN ACTIONS
async function upsertUser(adminJwt, u) {
  // POST /admin/users { full_name, email, password, role }
  return apiPost(AUTH, '/admin/users', {
    full_name: u.full_name,
    email:     u.email,
    password:  u.password,
    role:      u.role || 'voter'
  }, adminJwt);
}

async function setEligibility(adminJwt, electionId, userId) {
  // POST /admin/eligibility { election_id, user_id }
  return apiPost(AUTH, '/admin/eligibility', {
    election_id: electionId,
    user_id: userId
  }, adminJwt);
}

// Optionally clear local flags (needs a tiny admin route on your API)
async function resetLocalStatus(adminJwt, electionId) {
  // return apiPost(AUTH, '/admin/reset-local-status', { election_id: electionId }, adminJwt);
  return { skipped: true };
}

async function findUserIdsByEmails(adminJwt, emails) {
  // GET /admin/users
  const all = await apiGet(AUTH, '/admin/users', adminJwt);
  const map = new Map(all.map(u => [u.email, u.id]));
  return emails.map(e => map.get(e));
}

// Vote as a voter
async function vote(jwt, electionId, candidateId) {
  const t0 = Date.now();
  await apiPost(AUTH, `/elections/${electionId}/vote`, { candidateId }, jwt);
  return Date.now() - t0;
}

// ======== MAIN ========
(async () => {
  console.log('=== Bench (seed + vote) ===');
  console.log(`Auth API   : ${AUTH}`);
  console.log(`ElectionId : ${ELECTION_ID}`);
  console.log(`CandidateId: ${CANDIDATE_ID}`);
  console.log(`Users      : ${VOTERS_COUNT}`);
  console.log(`Mode       : ${PARALLEL ? 'Parallel' : 'Sequential'}`);
  console.log('----------------------------');

  try {
    // 0) Admin login
    process.stdout.write('Logging in as admin… ');
    const adminJwt = await login(ADMIN_EMAIL, ADMIN_PASS);
    console.log('ok');

    // 1) Upsert voters
    process.stdout.write('Upserting voters… ');
    await Promise.all(
      voters.map(v =>
        upsertUser(adminJwt, v).catch(e => ({ error: e?.response?.data || e.message }))
      )
    );
    console.log('ok');

    // 2) Get user IDs for eligibility
    process.stdout.write('Resolving user IDs… ');
    const ids = await findUserIdsByEmails(adminJwt, voters.map(v => v.email));
    const missing = ids.filter(id => !id);
    if (missing.length) {
      console.log('\nSome users not found (IDs missing). Re-check admin/users route.');
      process.exit(1);
    }
    console.log('ok');

    // 3) Set eligibility for each voter to ELECTION_ID
    process.stdout.write('Setting eligibility… ');
    await Promise.all(
      ids.map(uid => setEligibility(adminJwt, ELECTION_ID, uid)
        .catch(() => null)) // ignore duplicates (ON CONFLICT DO NOTHING)
    );
    console.log('ok');

    // 4) Optionally reset local_vote_status (to avoid “already voted” from earlier runs)
    if (USE_RESET_LOCAL_STATUS) {
      process.stdout.write('Resetting local vote status… ');
      await resetLocalStatus(adminJwt, ELECTION_ID);
      console.log('ok');
    } else {
      console.log('Skipping local reset (USE_RESET_LOCAL_STATUS=false)');
    }

    // 5) Login all voters
    console.log('Logging in voters…');
    const tokens = await Promise.all(voters.map(v =>
      login(v.email, v.password).catch(e => ({ err: e?.response?.data || e.message }))
    ));

    // 6) Vote
    console.log(PARALLEL ? 'Voting in parallel…' : 'Voting sequentially…');
    const start = Date.now();
    let results;

    if (PARALLEL) {
      results = await Promise.all(tokens.map(async tk => {
        if (tk?.err) return { ok: false, ms: 0, err: tk.err };
        try {
          const ms = await vote(tk, ELECTION_ID, CANDIDATE_ID);
          return { ok: true, ms };
        } catch (e) {
          return { ok: false, ms: 0, err: e?.response?.data || e.message };
        }
      }));
    } else {
      results = [];
      for (const tk of tokens) {
        if (tk?.err) { results.push({ ok: false, ms: 0, err: tk.err }); continue; }
        try {
          const ms = await vote(tk, ELECTION_ID, CANDIDATE_ID);
          results.push({ ok: true, ms });
        } catch (e) {
          results.push({ ok: false, ms: 0, err: e?.response?.data || e.message });
        }
      }
    }

    const totalMs = Date.now() - start;
    const ok = results.filter(r => r.ok).length;
    const fail = results.length - ok;
    const latencies = results.filter(r => r.ok).map(r => r.ms);
    const avgMs = latencies.length ? Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length) : 0;
    const minMs = latencies.length ? Math.min(...latencies) : 0;
    const maxMs = latencies.length ? Math.max(...latencies) : 0;

    console.log('\nSummary:');
    console.table([{
      batch: VOTERS_COUNT, success: ok, fail,
      totalMs, avgPerVoteMs: avgMs, minMs, maxMs
    }]);

    if (fail) {
      console.log('\nFailures (first 10):');
      results
        .map((r,i)=>({i, err:r.err}))
        .filter(r=>r.err)
        .slice(0,10)
        .forEach((r,idx)=> console.log(`#${idx+1}:`, r.err));
    }

    console.log('\nCSV:');
    console.log('Batch size,Success,Fail,Total Time (ms),Avg per vote (ms),Min (ms),Max (ms)');
    console.log(`${VOTERS_COUNT},${ok},${fail},${totalMs},${avgMs},${minMs},${maxMs}`);

  } catch (e) {
    console.error('\nFATAL:', e?.response?.data || e.message);
    process.exit(1);
  }
})();
