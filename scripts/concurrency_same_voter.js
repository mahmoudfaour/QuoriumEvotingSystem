// concurrency_same_voter.js — uses built-in fetch (no axios needed)
const AUTH = 'http://localhost:4000';
const ELECTION_ID = 1;
const CANDIDATE_ID = 1;

async function login(email, password) {
  const r = await fetch(`${AUTH}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function vote(token) {
  const r = await fetch(`${AUTH}/elections/${ELECTION_ID}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ candidateId: CANDIDATE_ID })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

(async () => {
  try {
    const { token } = await login('student2@uni.com', 'Voter123!');

    const v1 = vote(token);
    const v2 = vote(token);
    const [r1, r2] = await Promise.allSettled([v1, v2]);

    const fmt = (res) =>
      res.status === 'fulfilled'
        ? { ok: true, data: res.value }
        : { ok: false, err: res.reason?.message };

    console.log('Vote#1:', fmt(r1));
    console.log('Vote#2:', fmt(r2));
  } catch (e) {
    console.error('Setup error:', e.message);
    process.exit(1);
  }
})();
