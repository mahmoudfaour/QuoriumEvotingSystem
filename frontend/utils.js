// @ts-nocheck
// frontend/utils.js

// ---- Config kept in localStorage ----
const cfg = {
  authBase: localStorage.getItem('authBase') || 'http://localhost:4000',
  resultsBase: localStorage.getItem('resultsBase') || 'http://localhost:7000',
  jwt: localStorage.getItem('jwt') || '',
  electionId: Number(localStorage.getItem('electionId') || 1),
  candidateId: Number(localStorage.getItem('candidateId') || 0),
};

function saveCfg() {
  localStorage.setItem('authBase', cfg.authBase);
  localStorage.setItem('resultsBase', cfg.resultsBase);
  if (cfg.jwt) localStorage.setItem('jwt', cfg.jwt);
  localStorage.setItem('electionId', String(cfg.electionId));
  localStorage.setItem('candidateId', String(cfg.candidateId));
}

function setBases(auth, results) {
  cfg.authBase = String(auth || '').trim();
  cfg.resultsBase = String(results || '').trim();
  saveCfg();
}

// ---- HTTP helpers ----
async function apiGet(base, path, auth = false) {
  const res = await fetch(base + path, {
    headers: auth && cfg.jwt ? { Authorization: 'Bearer ' + cfg.jwt } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(base, path, body, auth = false) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth && cfg.jwt ? { Authorization: 'Bearer ' + cfg.jwt } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---- Navigation & guards ----
function go(page) { location.href = page; }
function requireToken() { if (!cfg.jwt) { toast('Please login first.', 'warn'); go('index.html'); } }
function requireElection() { if (!cfg.electionId) { toast('Choose an election first.', 'warn'); go('elections.html'); } }

// ---- Toasts ----
function toast(msg, type = 'ok', ms = 2200) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg);
  document.body.appendChild(t);
  // show
  requestAnimationFrame(() => t.classList.add('show'));
  // hide
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }, ms);
}

// ---- Top progress bar ----
let _pbNode = null, _pbTimer = null;
function progressStart() {
  if (!_pbNode) {
    _pbNode = document.createElement('div');
    _pbNode.className = 'progressbar';
    document.body.appendChild(_pbNode);
  }
  _pbNode.style.width = '0%';
  let w = 0;
  _pbTimer = setInterval(() => {
    w = Math.min(97, w + Math.random() * 7);
    _pbNode.style.width = w + '%';
  }, 200);
}
function progressDone() {
  if (!_pbNode) return;
  clearInterval(_pbTimer);
  _pbNode.style.width = '100%';
  setTimeout(() => { _pbNode.style.width = '0%'; }, 300);
}

// Expose globals
window.cfg = cfg;
window.saveCfg = saveCfg;
window.setBases = setBases;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.go = go;
window.requireToken = requireToken;
window.requireElection = requireElection;
window.toast = toast;
window.progressStart = progressStart;
window.progressDone = progressDone;
