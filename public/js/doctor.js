'use strict';

// ══════════════════════════════════════════════════════════════════
// VISTA DOCTOR — MIS CITAS
// ══════════════════════════════════════════════════════════════════

let _docApptMode = 'today';

async function loadDocAppts(mode) {
  _docApptMode = mode || _docApptMode;
  const el = document.getElementById('doc-appts-list');

  // Estilos de los botones de filtro
  document.getElementById('dab-today').className = _docApptMode === 'today'
    ? 'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 border-brand bg-blue-50 text-brand transition-all'
    : 'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-all';
  document.getElementById('dab-all').className = _docApptMode === 'all'
    ? 'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 border-brand bg-blue-50 text-brand transition-all'
    : 'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-all';

  el.innerHTML = spinner('Cargando citas…');
  try {
    const qs = _docApptMode === 'today' ? '?today=1' : '';
    const { appointments: appts } = await apiFetch('/appointments/mine' + qs);
    if (!appts.length) {
      el.innerHTML = emptyState(
        _docApptMode === 'today' ? 'Sin citas hoy' : 'Sin citas registradas',
        _docApptMode === 'today' ? 'No tienes pacientes agendados para hoy' : 'Aún no tienes citas registradas'
      );
      return;
    }
    el.innerHTML = appts.map(a => `
      <article onclick="docOpenPatient('${esc(a.patient_email)}')"
               class="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-3 cursor-pointer hover:border-brand hover:shadow-[0_0_0_3px_rgba(24,73,244,.07)] transition-all shadow-sm grid grid-cols-[100px_1fr_auto] gap-4 items-center">
        <div class="text-center">
          <div class="font-display font-bold text-sm text-brand">${fmtDT(a.appointment_date)}</div>
          <div class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">#${a.id}</div>
        </div>
        <div>
          <div class="font-semibold text-sm mb-0.5">${esc(a.patient_name)}</div>
          <div class="text-xs text-gray-500">${esc(a.patient_email)}</div>
          <div class="text-xs text-gray-400 mt-1">${esc(a.treatment_description)} · ${esc(a.insurance_name || 'Sin seguro')}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="font-display font-bold text-sm text-green-600">${fmt(a.amount_paid)}</div>
          <div class="text-[11px] text-gray-400 mt-1">Ver historial →</div>
        </div>
      </article>`).join('');
  } catch (e) { el.innerHTML = errSt(e.message); }
}

// El doctor hace clic en un paciente → va a la pestaña de pacientes y carga su historial
async function docOpenPatient(email) {
  goTo('doc-patients');
  document.getElementById('doc-pat-q').value = email;
  await loadPatientHistoryInDocView(email);
}

// ══════════════════════════════════════════════════════════════════
// VISTA DOCTOR — BÚSQUEDA DE PACIENTES
// ══════════════════════════════════════════════════════════════════

async function searchPatients() {
  const q  = document.getElementById('doc-pat-q').value.trim();
  const el = document.getElementById('doc-pat-results');
  if (!q) { el.innerHTML = ''; return; }
  el.innerHTML = spinner('Buscando…');
  try {
    const { patients } = await apiFetch('/patients?q=' + encodeURIComponent(q));
    if (!patients.length) {
      el.innerHTML = emptyState('Sin resultados', 'Intenta con otro nombre o email');
      return;
    }
    el.innerHTML = `<div class="flex flex-col gap-2 mb-2">` +
      patients.map(p => `
        <div onclick="loadPatientHistoryInDocView('${esc(p.email)}')"
             class="bg-white border border-gray-100 rounded-2xl px-4 py-3 cursor-pointer hover:border-brand hover:shadow-[0_0_0_3px_rgba(24,73,244,.07)] transition-all shadow-sm flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gray-100 grid place-items-center font-display font-bold text-sm text-gray-600 flex-shrink-0">${esc(p.name[0]?.toUpperCase() || '?')}</div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm">${esc(p.name)}</div>
            <div class="text-xs text-gray-500 truncate">${esc(p.email)}${p.phone ? ' · ' + esc(p.phone) : ''}</div>
          </div>
          <span class="text-xs text-brand font-semibold flex-shrink-0">Ver historial →</span>
        </div>`).join('') + `</div>`;
  } catch (e) { el.innerHTML = errSt(e.message); }
}

async function loadPatientHistoryInDocView(email) {
  const el = document.getElementById('doc-pat-history');
  el.innerHTML = spinner('Cargando historial…');
  try {
    const { patient, appointments: a, summary: s, events } =
      await apiFetch('/patients/' + encodeURIComponent(email.toLowerCase()) + '/history');
    window._patientEvents       = events || [];
    window._currentPatientEmail = email.toLowerCase();
    el.innerHTML = renderHistoryBlock(patient, a, s, true);
  } catch (e) {
    window._patientEvents = [];
    el.innerHTML = errSt(e.message);
  }
}
