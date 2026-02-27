'use strict';

// ── NAV CONFIG ────────────────────────────────────────────────────
const NAV_ADMIN = [
  { view: 'doctors',      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',  label: 'Médicos' },
  { view: 'history',      icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',  label: 'Historial' },
  { view: 'revenue',      icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',  label: 'Recaudación' },
];
const NAV_DOCTOR = [
  { view: 'doc-appts',    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01"/>', label: 'Mis Citas' },
  { view: 'doc-patients', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',  label: 'Pacientes' },
];
const NAV_PATIENT = [
  { view: 'pat-appts',    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01"/>',  label: 'Mis Citas' },
  { view: 'pat-history',  icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',  label: 'Mi Historial' },
];

const PAGE_TITLES = {
  doctors:        'Médicos',
  history:        'Historial',
  revenue:        'Recaudación',
  'doc-appts':    'Mis Citas',
  'doc-patients': 'Pacientes',
  'pat-appts':    'Mis Citas',
  'pat-history':  'Mi Historial',
};

// ── MOSTRAR APP TRAS LOGIN ────────────────────────────────────────
function showApp() {
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('app').classList.replace('hidden', 'flex');
  if (_usr) {
    const n = _usr.name || _usr.email;
    document.getElementById('u-name').textContent = n;
    document.getElementById('u-role').textContent = _usr.role;
    document.getElementById('u-av').textContent   = n[0].toUpperCase();
    buildNav(_usr.role);
  }
}

// ── CONSTRUIR SIDEBAR ─────────────────────────────────────────────
function buildNav(role) {
  const items = role === 'admin' ? NAV_ADMIN : role === 'doctor' ? NAV_DOCTOR : NAV_PATIENT;
  const el = document.getElementById('sb-links');
  let html = '<div class="text-[11px] font-bold text-white/20 uppercase tracking-[.1em] px-2.5 mb-2 mt-1">Principal</div>';
  items.forEach((item, i) => {
    const active = i === 0;
    html += `<button class="ni flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left mt-0.5 ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/[0.07] hover:text-white/80'}" data-view="${item.view}" onclick="goTo('${item.view}')" ${active ? 'aria-current="page"' : ''}>
      <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>
      ${item.label}
    </button>`;
  });
  if (role === 'admin') {
    html += `<div class="text-[10px] font-bold text-white/20 uppercase tracking-[.1em] px-2.5 mt-4 mb-1.5">Admin</div>
    <button class="ni flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left text-white/40 hover:bg-white/[0.07] hover:text-white/80 mt-0.5" onclick="opnMd('rehash-modal')">
      <svg class="w-4 h-4 flex-shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Activar usuarios
    </button>`;
  }
  el.innerHTML = html;
}

// ── NAVEGACIÓN ENTRE PÁGINAS ──────────────────────────────────────
function goHome() {
  const role = _usr?.role;
  if (role === 'admin')       goTo('doctors');
  else if (role === 'doctor') goTo('doc-appts');
  else                        goTo('pat-appts');
}

function goTo(v) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('flex');
  });
  document.querySelectorAll('.ni').forEach(n => {
    const active = n.dataset.view === v;
    n.classList.toggle('bg-white/10',          active);
    n.classList.toggle('text-white',           active);
    n.classList.toggle('text-white/40',       !active);
    n.classList.toggle('hover:bg-white/[0.07]',!active);
    n.classList.toggle('hover:text-white/80', !active);
    n.setAttribute('aria-current', active ? 'page' : 'false');
  });
  const pg = document.getElementById('pg-' + v);
  if (pg) { pg.classList.remove('hidden'); pg.classList.add('flex'); }
  const t = document.getElementById('tb-title');
  if (t) t.textContent = PAGE_TITLES[v] || 'SaludPlus';
  clSB();
  // Cargar datos al cambiar de pestaña
  if (v === 'doctors')       loadDocs();
  if (v === 'revenue')       loadRev();
  if (v === 'doc-appts')     loadDocAppts('today');
  if (v === 'doc-patients')  {
    document.getElementById('doc-pat-results').innerHTML = '';
    document.getElementById('doc-pat-history').innerHTML = '';
  }
  if (v === 'pat-appts')     loadPatAppts();
  if (v === 'pat-history')   loadPatHistory();
}

// ── SIDEBAR MÓVIL ─────────────────────────────────────────────────
function togSB() {
  const sb = document.getElementById('sb');
  const ov = document.getElementById('sb-ov');
  const open = sb.classList.toggle('translate-x-0');
  sb.classList.toggle('-translate-x-full', !open);
  ov.classList.toggle('hidden', !open);
}
function clSB() {
  document.getElementById('sb').classList.remove('translate-x-0');
  document.getElementById('sb').classList.add('-translate-x-full');
  document.getElementById('sb-ov').classList.add('hidden');
}

// ── MODALES ───────────────────────────────────────────────────────
function opnMd(id) {
  const el = document.getElementById(id);
  el.classList.replace('hidden', 'flex');
  const f = el.querySelectorAll('button,input,[tabindex]');
  if (f[0]) f[0].focus();
}
function clMd(id) {
  document.getElementById(id).classList.replace('flex', 'hidden');
}
