'use strict';

// ══════════════════════════════════════════════════════════════════
// VISTA PACIENTE — MIS CITAS
// ══════════════════════════════════════════════════════════════════

async function loadPatAppts() {
  const el = document.getElementById('pat-appts-list');
  el.innerHTML = spinner('Cargando tus citas…');
  try {
    const { appointments: appts } = await apiFetch('/appointments/mine');
    if (!appts.length) {
      el.innerHTML = emptyState('Sin citas', 'Aún no tienes citas registradas. ¡Pide una!');
      return;
    }
    el.innerHTML = `<div class="flex flex-col gap-3">` + appts.map(a => `
      <article class="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm grid grid-cols-[100px_1fr_auto] gap-4 items-start hover:border-gray-200 transition-all">
        <div>
          <div class="font-display font-bold text-sm text-brand leading-tight">${fmtDT(a.appointment_date)}</div>
          <div class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">#${a.id}</div>
        </div>
        <div>
          <div class="font-semibold text-sm mb-0.5">${esc(a.treatment_description)}</div>
          <div class="flex items-center gap-2 flex-wrap mt-1">
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Dr. ${esc(a.doctor_name)}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getBg(a.specialty)}">${esc(a.specialty)}</span>
          </div>
          <div class="text-xs text-gray-400 mt-1">${esc(a.insurance_name || 'Sin seguro')}${a.coverage_percentage ? ' · ' + a.coverage_percentage + '% cobertura' : ''}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-xs text-gray-400 line-through font-display">${fmt(a.treatment_cost)}</div>
          <div class="font-display font-bold text-sm text-green-600">${fmt(a.amount_paid)}</div>
          <div class="text-[11px] text-gray-400">pagado</div>
        </div>
      </article>`).join('') + `</div>`;
  } catch (e) { el.innerHTML = errSt(e.message); }
}

// ══════════════════════════════════════════════════════════════════
// VISTA PACIENTE — MI HISTORIAL
// ══════════════════════════════════════════════════════════════════

async function loadPatHistory() {
  const el = document.getElementById('pat-history-content');
  if (!_usr?.email) return;
  el.innerHTML = spinner('Cargando historial…');
  try {
    const { patient, appointments: a, summary: s, events } =
      await apiFetch('/patients/' + encodeURIComponent(_usr.email) + '/history');
    window._patientEvents = events || [];
    el.innerHTML = renderHistoryBlock(patient, a, s, false);
  } catch (e) {
    window._patientEvents = [];
    if (e.message.includes('not found') || e.message.includes('404')) {
      el.innerHTML = emptyState('Sin historial', 'Aún no tienes consultas registradas en el sistema.');
    } else {
      el.innerHTML = errSt(e.message);
    }
  }
}
