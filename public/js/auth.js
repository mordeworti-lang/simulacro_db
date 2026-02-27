'use strict';

// ── PANEL DE ESTADÍSTICAS EN LOGIN ───────────────────────────────
async function loadPanelStats() {
  try {
    const d = await apiFetch('/doctors');
    document.getElementById('st-d').textContent = d.doctors.length;
  } catch {}
  try {
    const d = await apiFetch('/reports/revenue');
    document.getElementById('st-a').textContent =
      d.report.byInsurance.reduce((s, i) => s + i.appointmentCount, 0);
  } catch {}
}

// ── SWITCH ENTRE LOGIN Y REGISTRO ────────────────────────────────
function sw(target) {
  const l = document.getElementById('fl');
  const r = document.getElementById('fr');
  l.classList.toggle('hidden', target !== 'l');
  r.classList.toggle('hidden', target !== 'r');
  clearA('la'); clearA('ra');
  setTimeout(() => {
    const i = (target === 'l' ? l : r).querySelector('input');
    if (i) i.focus();
  }, 50);
}

// ── LOGIN ─────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('le').value.trim();
  const pw    = document.getElementById('lp').value;
  clearA('la');
  if (!email || !pw)       return showA('la', 'la-m', 'Completa todos los campos.');
  if (!isEmail(email))     return showA('la', 'la-m', 'Email inválido.');
  if (pw.length < 6)       return showA('la', 'la-m', 'Contraseña muy corta (mín. 6 chars).');
  setBtn('lb', true, 'Iniciando…');
  try {
    const d = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
    onAuth(d);
    toast('Sesión iniciada', 'ok');
  } catch (e) {
    showA('la', 'la-m', e.message);
  } finally {
    setBtn('lb', false, 'Iniciar sesión');
  }
}

// ── SELECTOR DE ROL EN REGISTRO ───────────────────────────────────
let _role = 'patient';

function pickRole(el) {
  document.querySelectorAll('.ro').forEach(o => {
    o.classList.remove('border-brand', 'bg-blue-50');
    o.classList.add('border-gray-200');
    o.setAttribute('aria-checked', 'false');
    o.querySelector('span:last-child').classList.replace('text-brand', 'text-gray-500');
  });
  el.classList.add('border-brand', 'bg-blue-50');
  el.classList.remove('border-gray-200');
  el.setAttribute('aria-checked', 'true');
  el.querySelector('span:last-child').classList.replace('text-gray-500', 'text-brand');
  _role = el.dataset.role;
  document.getElementById('reg-doctor-fields').classList.toggle('hidden', _role !== 'doctor');
  document.getElementById('reg-patient-fields').classList.toggle('hidden', _role !== 'patient');
}

// ── REGISTRO ──────────────────────────────────────────────────────
async function doRegister() {
  const name      = document.getElementById('rn').value.trim();
  const email     = document.getElementById('re').value.trim();
  const pw        = document.getElementById('rp').value;
  const specialty = document.getElementById('r-specialty').value.trim();
  const phone     = document.getElementById('r-phone').value.trim();
  const address   = document.getElementById('r-address').value.trim();
  clearA('ra');
  if (!name || !email || !pw)  return showA('ra', 'ra-m', 'Completa todos los campos.');
  if (name.length < 2)         return showA('ra', 'ra-m', 'Nombre muy corto.');
  if (!isEmail(email))         return showA('ra', 'ra-m', 'Email inválido.');
  if (pw.length < 6)           return showA('ra', 'ra-m', 'Contraseña mín. 6 caracteres.');
  if (_role === 'doctor' && !specialty) return showA('ra', 'ra-m', 'La especialidad es requerida para médicos.');
  setBtn('rb', true, 'Creando cuenta…');
  try {
    const body = { name, email, password: pw, role: _role };
    if (_role === 'doctor') body.specialty = specialty;
    if (_role === 'patient') {
      if (phone)   body.phone   = phone;
      if (address) body.address = address;
    }
    const d = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    onAuth(d);
    toast('Bienvenido, ' + esc(d.user.name) + '!', 'ok');
  } catch (e) {
    showA('ra', 'ra-m', e.message);
  } finally {
    setBtn('rb', false, 'Crear cuenta');
  }
}

// ── AFTER AUTH ────────────────────────────────────────────────────
function onAuth(d) {
  _tok = d.accessToken;
  _usr = d.user;
  store.set('tok', _tok);
  store.set('usr', _usr);
  showApp();
  goHome();
}

// ── LOGOUT ────────────────────────────────────────────────────────
function doLogout(silent = false) {
  _tok = null; _usr = null; _docs = [];
  store.del('tok'); store.del('usr');
  document.getElementById('app').classList.replace('flex', 'hidden');
  document.getElementById('auth').classList.remove('hidden');
  sw('l');
  document.getElementById('le').value = '';
  document.getElementById('lp').value = '';
  if (!silent) toast('Sesión cerrada', 'info');
}
