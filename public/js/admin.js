'use strict';

// ══════════════════════════════════════════════════════════════════
// VISTA ADMIN — MÉDICOS
// ══════════════════════════════════════════════════════════════════

async function loadDocs() {
  const w = document.getElementById('dt');
  w.innerHTML = spinner('Cargando médicos…');
  try {
    const d = await apiFetch('/doctors');
    _docs = d.doctors;
    buildSF(_docs);
    renderDocs(_docs);
  } catch (e) { w.innerHTML = errSt(e.message); }
}

function buildSF(docs) {
  const s   = document.getElementById('sf');
  const sps = [...new Set(docs.map(d => d.specialty))].sort();
  s.innerHTML = '<option value="">Todas las especialidades</option>'
    + sps.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
}

function filterDoc() {
  const q  = document.getElementById('ds').value.toLowerCase().trim();
  const sp = document.getElementById('sf').value;
  renderDocs(_docs.filter(d =>
    (!q  || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)) &&
    (!sp || d.specialty === sp)
  ));
}

function renderDocs(docs) {
  const w = document.getElementById('dt');
  document.getElementById('dc').textContent = docs.length + ' médico' + (docs.length !== 1 ? 's' : '');
  if (!docs.length) { w.innerHTML = emptyState('Sin resultados', 'Intenta con otro filtro'); return; }
  w.innerHTML = `
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100">Médico</th>
          <th class="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100 hidden sm:table-cell">Especialidad</th>
          <th class="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100 hidden md:table-cell">Email</th>
          <th class="px-4 py-2.5 bg-gray-50 border-b border-gray-100 w-10"></th>
        </tr>
      </thead>
      <tbody>
        ${docs.map(d => {
          const isMe     = _usr && _usr.role === 'doctor' && _usr.email === d.email;
          const rowClass = isMe ? 'bg-blue-50/40' : 'hover:bg-gray-50';
          const meBadge  = isMe ? '<span class="ml-2 text-[10px] font-bold uppercase tracking-wide bg-brand text-white px-1.5 py-0.5 rounded-full align-middle">Tú</span>' : '';
          return `<tr class="border-b border-gray-100 last:border-0 transition-colors ${rowClass}">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-100 grid place-items-center font-display font-bold text-xs text-gray-600 flex-shrink-0">${esc(d.name[0]?.toUpperCase() || '?')}</div>
                <div>
                  <div class="font-semibold text-sm">${esc(d.name)}${meBadge}</div>
                  <div class="text-xs text-gray-400 sm:hidden">${esc(d.specialty)}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getBg(d.specialty)}">${esc(d.specialty)}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">${esc(d.email)}</td>
            <td class="px-4 py-3">
              <button onclick="opnDoc(${d.id})" class="text-xs text-brand font-semibold hover:underline">Editar</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function opnDoc(id) {
  const d = _docs.find(x => x.id === id);
  if (!d) return;
  document.getElementById('en').value = d.name;
  document.getElementById('ee').value = d.email;
  document.getElementById('es').value = d.specialty;
  clearA('ea');
  opnMd('dm');
  document.getElementById('eb').onclick = () => saveDoc(id);
}

function kv(label, value) {
  return `<div><span class="text-xs text-gray-400 uppercase tracking-wide font-bold">${label}</span><p class="font-semibold mt-0.5">${value}</p></div>`;
}

async function saveDoc(id) {
  const name      = document.getElementById('en').value.trim();
  const email     = document.getElementById('ee').value.trim();
  const specialty = document.getElementById('es').value.trim();
  clearA('ea');
  if (!name || !email || !specialty) return showA('ea', 'ea-m', 'Todos los campos son requeridos.');
  if (!isEmail(email))               return showA('ea', 'ea-m', 'Email inválido.');
  setBtn('eb', true, 'Guardando…');
  try {
    await apiFetch('/doctors/' + id, { method: 'PUT', body: JSON.stringify({ name, email, specialty }) });
    clMd('dm');
    toast('Médico actualizado', 'ok');
    loadDocs();
  } catch (e) { showA('ea', 'ea-m', e.message); }
  finally { setBtn('eb', false, 'Guardar cambios'); }
}

// ══════════════════════════════════════════════════════════════════
// VISTA ADMIN — HISTORIAL DE PACIENTES
// ══════════════════════════════════════════════════════════════════

async function loadHist() {
  const email = document.getElementById('he').value.trim();
  const res   = document.getElementById('hr');
  if (!email)          return toast('Ingresa un email', 'err');
  if (!isEmail(email)) return toast('Email inválido', 'err');
  res.innerHTML = spinner('Buscando historial…');
  try {
    const { patient, appointments: a, summary: s } = await apiFetch(
      '/patients/' + encodeURIComponent(email.toLowerCase()) + '/history'
    );
    res.innerHTML = renderHistoryBlock(patient, a, s, true);
  } catch (e) { res.innerHTML = errSt(e.message); }
}

// ══════════════════════════════════════════════════════════════════
// VISTA ADMIN — RECAUDACIÓN
// ══════════════════════════════════════════════════════════════════

const RCOLS = ['#1849F4','#17B26A','#F59E0B','#8B5CF6','#EC4899','#06B6D4'];

async function loadRev() {
  const res = document.getElementById('rr');
  if (!res) return;
  res.innerHTML = spinner('Cargando…');
  const s = document.getElementById('rs')?.value;
  const e = document.getElementById('re2')?.value;
  let qs = '';
  if (s) qs += 'startDate=' + s + '&';
  if (e) qs += 'endDate=' + e;
  try {
    const { report: r } = await apiFetch('/reports/revenue' + (qs ? '?' + qs : ''));
    const mx  = Math.max(...r.byInsurance.map(i => i.totalAmount), 1);
    const tot = r.byInsurance.reduce((s, i) => s + i.appointmentCount, 0);
    res.innerHTML = `
      <div class="grid grid-cols-3 gap-3 mb-5">
        ${statCard('dark','Total recaudado',`<span class="font-display font-bold text-xl tracking-tight">${fmt(r.totalRevenue)}</span>`,r.period.startDate ? r.period.startDate + ' → ' + r.period.endDate : 'Todo el período')}
        ${statCard('blue','Aseguradoras',`<span class="font-display font-bold text-3xl tracking-tight">${r.byInsurance.length}</span>`,'activas')}
        ${statCard('green','Consultas',`<span class="font-display font-bold text-3xl tracking-tight">${tot}</span>`,'en el período')}
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
        <div class="px-5 py-4 border-b border-gray-100"><span class="font-display font-bold text-sm tracking-tight">Desglose por seguro</span></div>
        <div class="p-5 flex flex-col gap-3">
          ${r.byInsurance.map((i, idx) => {
            const p = Math.max(i.totalAmount / mx * 100, 2);
            const c = RCOLS[idx % RCOLS.length];
            return `<div class="flex items-center gap-3">
              <div class="w-28 text-xs text-gray-500 text-right flex-shrink-0 truncate" title="${esc(i.insuranceName)}">${esc(i.insuranceName)}</div>
              <div class="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                <div class="h-full rounded-lg transition-all duration-700" style="width:${p}%;background:${c}"></div>
              </div>
              <div class="text-xs font-bold font-display whitespace-nowrap flex-shrink-0" style="color:${c}">${fmt(i.totalAmount)}</div>
              <div class="w-16 text-xs text-gray-400 flex-shrink-0 font-display font-semibold">${i.appointmentCount} citas</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100"><span class="font-display font-bold text-sm tracking-tight">Tabla detallada</span></div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="px-5 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100">Aseguradora</th>
                <th class="px-5 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100">Monto total</th>
                <th class="px-5 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100">Consultas</th>
                <th class="px-5 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[.08em] bg-gray-50 border-b border-gray-100">Promedio</th>
              </tr>
            </thead>
            <tbody>
              ${r.byInsurance.map(i => `
                <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3 text-sm font-semibold">${esc(i.insuranceName)}</td>
                  <td class="px-5 py-3 font-display font-semibold text-sm">${fmt(i.totalAmount)}</td>
                  <td class="px-5 py-3 text-sm text-gray-600">${i.appointmentCount}</td>
                  <td class="px-5 py-3 text-sm text-gray-500">${fmt(Math.round(i.totalAmount / i.appointmentCount))}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { res.innerHTML = errSt(e.message); }
}

function clRev() {
  document.getElementById('rs').value  = '';
  document.getElementById('re2').value = '';
  loadRev();
}
