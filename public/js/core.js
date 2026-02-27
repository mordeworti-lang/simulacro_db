'use strict';

// ── CONSTANTES ────────────────────────────────────────────────────
const API = '/api';

// ── HELPERS DE TEXTO / FORMATO ───────────────────────────────────
const esc = s => s == null ? '' : String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');

const fmt = n => n == null || isNaN(n) ? '—'
  : new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);

const fmtD = d => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
};

const fmtDT = d => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'})
    + ' ' + date.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'});
};

const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ── SESSION STORE (sessionStorage) ───────────────────────────────
const store = {
  set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch {} },
  get: (k)    => { try { return JSON.parse(sessionStorage.getItem(k)) } catch { return null } },
  del: (k)    => { try { sessionStorage.removeItem(k) } catch {} }
};

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let _tok  = store.get('tok');
let _usr  = store.get('usr');
let _docs = [];

// Colores para especialidades
const BGMAP = {
  Cardiology:   'bg-blue-100 text-blue-700',
  Pediatrics:   'bg-green-100 text-green-700',
  Orthopedics:  'bg-amber-100 text-amber-700',
  Neurology:    'bg-purple-100 text-purple-700',
  Dermatology:  'bg-pink-100 text-pink-700',
};
const BGPOOL  = ['bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-pink-100 text-pink-700'];
const BGCACHE = {};
let _bgi = 0;
function getBg(sp) {
  if (!BGCACHE[sp]) BGCACHE[sp] = BGMAP[sp] || BGPOOL[_bgi++ % BGPOOL.length];
  return BGCACHE[sp];
}

// ── API FETCH ─────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (_tok) h['Authorization'] = 'Bearer ' + _tok;
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
  } catch {
    throw new Error('No se pudo conectar. Verifica tu conexión.');
  }
  let data;
  try { data = await res.json() } catch { data = {} }
  if (res.status === 401) { doLogout(true); throw new Error('Sesión expirada.'); }
  if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
  return data;
}

// ── BOTÓN CON SPINNER ─────────────────────────────────────────────
function setBtn(id, loading, text) {
  const b = document.getElementById(id);
  if (!b) return;
  b.disabled = loading;
  const sp = document.getElementById(id + '-sp');
  const t  = document.getElementById(id + '-t');
  if (sp) sp.classList.toggle('hidden', !loading);
  if (t)  t.textContent = text;
}

// ── ALERTAS INLINE ────────────────────────────────────────────────
function showA(cid, mid, msg) {
  const c = document.getElementById(cid);
  const m = document.getElementById(mid);
  if (m) m.textContent = msg;
  c.classList.replace('hidden', 'flex');
}
function clearA(id) {
  document.getElementById(id)?.classList.replace('flex', 'hidden');
}

// ── TOAST ─────────────────────────────────────────────────────────
const TICONS = {
  ok:   '<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  err:  '<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info: '<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};
const TOAST_BORDER = { ok: 'border-l-green-500', err: 'border-l-red-500', info: 'border-l-brand' };

function toast(msg, type = 'info', ms = 3400) {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `animate-toastIn bg-gray-800 text-white px-4 py-2.5 rounded-2xl text-sm font-medium shadow-xl flex items-center gap-2 max-w-xs pointer-events-auto border-l-4 ${TOAST_BORDER[type] || 'border-l-brand'}`;
  t.innerHTML = (TICONS[type] || '') + `<span>${esc(msg)}</span>`;
  t.setAttribute('role', 'status');
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(5px) scale(.97)';
    t.style.transition = 'all .2s';
    setTimeout(() => t.remove(), 220);
  }, ms);
}

// ── ESTADOS DE CARGA / VACÍO / ERROR ─────────────────────────────
function spinner(msg) {
  return `<div class="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
    <div class="w-7 h-7 border-2 border-gray-200 border-t-brand rounded-full animate-spin"></div>
    <p class="text-sm">${esc(msg)}</p>
  </div>`;
}
function emptyState(title, sub) {
  return `<div class="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 text-center">
    <svg class="w-10 h-10 opacity-25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <p class="text-sm"><strong class="text-gray-600 font-semibold block mb-1">${esc(title)}</strong>${esc(sub)}</p>
  </div>`;
}
function errSt(msg) {
  return `<div class="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 text-center">
    <svg class="w-10 h-10 opacity-25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <p class="text-sm"><strong class="text-gray-600 font-semibold block mb-1">Algo salió mal</strong>${esc(msg)}</p>
  </div>`;
}

function statCard(type, label, value, sub) {
  const themes = {
    dark:  'bg-gray-950 border-gray-950',
    blue:  'bg-white border-gray-100',
    green: 'bg-white border-gray-100',
    gray:  'bg-white border-gray-100',
  };
  const labelColor = type === 'dark' ? 'text-white/38' : 'text-gray-400';
  const subColor   = type === 'dark' ? 'text-white/28' : 'text-gray-400';
  const valueClass = type === 'dark' ? '[&_*]:text-white' : '';
  return `<div class="border ${themes[type]} rounded-2xl px-5 py-4 shadow-sm ${valueClass}">
    <div class="text-[11px] font-bold uppercase tracking-wider ${labelColor} mb-2">${label}</div>
    <div class="mb-1">${value}</div>
    <div class="text-xs ${subColor}">${sub}</div>
  </div>`;
}
