'use strict';

// ══════════════════════════════════════════════════════════════════
// RENDER DE HISTORIAL (compartido por admin, doctor y paciente)
// ══════════════════════════════════════════════════════════════════

function renderHistoryBlock(patient, a, s, canAddAppt) {
  const addBtn = canAddAppt ? `
    <button type="button" onclick="openAddDiagnosis('${esc(patient.email)}', '${esc(patient.name)}')"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition-all">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      Agregar diagnóstico
    </button>` : '';

  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      ${statCard('dark','Paciente',`<span class="font-display font-bold text-lg leading-tight tracking-tight">${esc(patient.name)}</span>`,esc(patient.email))}
      ${statCard('blue','Consultas',`<span class="font-display font-bold text-3xl tracking-tight">${s.totalAppointments}</span>`,'en total')}
      ${statCard('green','Total pagado',`<span class="font-display font-bold text-xl tracking-tight">${fmt(s.totalSpent)}</span>`,'copagos')}
      ${statCard('gray','Esp. frecuente',`<span class="font-display font-bold text-lg tracking-tight">${esc(s.mostFrequentSpecialty || '—')}</span>`,'&nbsp;')}
    </div>
    <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span class="font-display font-bold text-sm tracking-tight">Citas registradas</span>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400">${a.length} registro${a.length !== 1 ? 's' : ''}</span>
          ${addBtn}
        </div>
      </div>
      ${a.length === 0
        ? emptyState('Sin citas', 'No hay citas registradas')
        : `<div class="flex flex-col gap-2 p-4">${a.map(x => `
          <article class="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 grid grid-cols-[100px_1fr_auto] gap-4 items-start hover:border-brand hover:shadow-[0_0_0_3px_rgba(24,73,244,.06)] transition-all shadow-sm">
            <div class="font-display text-xs font-semibold text-gray-400 pt-0.5 leading-relaxed">${fmtDT(x.date)}</div>
            <div>
              <div class="font-semibold text-sm mb-0.5">${esc(x.treatmentDescription)}</div>
              <div class="text-xs text-gray-500">Dr. ${esc(x.doctorName)} · <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getBg(x.specialty)}">${esc(x.specialty)}</span></div>
              <div class="text-xs text-gray-400 mt-1">${esc(x.insuranceProvider)} · ${x.coveragePercentage}% cobertura</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400 line-through font-display">${fmt(x.treatmentCost)}</div>
              <div class="font-display font-bold text-sm text-green-600 tracking-tight">${fmt(x.amountPaid)}</div>
            </div>
          </article>`).join('')}</div>`}
    </div>
    ${renderEventsSection(a, canAddAppt, patient)}`;
}

function renderEventsSection(appts, canAddAppt, patient) {
  const evts = window._patientEvents || [];
  if (!evts.length && !canAddAppt) return '';
  const evtTypeBg = {
    'Diagnóstico':        'bg-red-50 text-red-700 border-red-200',
    'Tratamiento':        'bg-blue-50 text-blue-700 border-blue-200',
    'Observación':        'bg-gray-50 text-gray-600 border-gray-200',
    'Seguimiento':        'bg-amber-50 text-amber-700 border-amber-200',
    'Resultado de examen':'bg-purple-50 text-purple-700 border-purple-200',
    'Medicación':         'bg-green-50 text-green-700 border-green-200',
  };
  const evtCards = evts.length
    ? evts.slice().reverse().map(ev => `
      <article class="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${evtTypeBg[ev.eventType] || 'bg-gray-50 text-gray-600 border-gray-200'}">${esc(ev.eventType)}</span>
          <span class="text-xs text-gray-400 flex-shrink-0">${fmtD(ev.date)}</span>
        </div>
        <div class="font-semibold text-sm mb-1">${esc(ev.title)}</div>
        <div class="text-xs text-gray-500 leading-relaxed">${esc(ev.notes)}</div>
        ${ev.prescription ? `<div class="mt-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5"><span class="font-bold">Rx:</span> ${esc(ev.prescription)}</div>` : ''}
        <div class="text-[11px] text-gray-300 mt-2">Agregado por ${esc(ev.addedBy || '—')}</div>
      </article>`).join('')
    : `<p class="text-sm text-gray-400 py-4 text-center">Sin eventos clínicos registrados aún.</p>`;

  return `
    <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-4">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span class="font-display font-bold text-sm tracking-tight">Eventos clínicos y diagnósticos</span>
        ${canAddAppt ? `<button type="button" onclick="openAddDiagnosis('${esc(patient.email)}','${esc(patient.name)}')"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-xl hover:bg-blue-700 transition-all">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo evento
        </button>` : ''}
      </div>
      <div class="p-4 flex flex-col gap-3">${evtCards}</div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════
// MODAL — NUEVA CITA
// (treatmentCode se genera automáticamente; appointmentDate con hora)
// ══════════════════════════════════════════════════════════════════

let _formData = null;

async function openNewApptForPatient(email) {
  await openNewAppt();
  const waitAndSelect = (tries = 0) => {
    const sel = document.getElementById('na-patient');
    if (!sel || sel.options.length <= 1) {
      if (tries < 20) setTimeout(() => waitAndSelect(tries + 1), 150);
      return;
    }
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text.includes(email)) { sel.selectedIndex = i; break; }
    }
  };
  waitAndSelect();
}

async function openNewAppt() {
  if (_usr?.role === 'doctor') {
    toast('Los médicos agregan eventos al historial del paciente, no citas', 'info');
    return;
  }
  _formData = null;
  opnMd('new-appt-modal');
  document.getElementById('na-loading').classList.remove('hidden');
  document.getElementById('na-form').classList.add('hidden');
  document.getElementById('na-form').classList.remove('flex');
  try {
    const d = await apiFetch('/admin/form-data');
    _formData = d;
    document.getElementById('na-loading').classList.add('hidden');
    populateNewApptForm(d);
  } catch (e) {
    document.getElementById('na-loading').innerHTML =
      '<p class="text-red-500 text-sm">Error cargando datos: ' + esc(e.message) + '</p>';
  }
}

function populateNewApptForm({ patients, doctors, insurances }) {
  const pSel = document.getElementById('na-patient');
  const dSel = document.getElementById('na-doctor');
  const iSel = document.getElementById('na-insurance');

  if (_usr?.role === 'patient') {
    const me = patients.find(p => p.email === _usr.email);
    if (me) {
      pSel.innerHTML = `<option value="${me.id}" selected>${esc(me.name)} (${esc(me.email)})</option>`;
      pSel.disabled  = true;
    } else {
      pSel.innerHTML = '<option value="">— Tu perfil de paciente no fue encontrado —</option>';
      pSel.disabled  = true;
    }
  } else {
    pSel.disabled  = false;
    pSel.innerHTML = '<option value="">— Selecciona un paciente —</option>'
      + patients.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.email)})</option>`).join('');
  }

  dSel.innerHTML = '<option value="">— Selecciona un médico —</option>'
    + doctors.map(d => `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialty)}</option>`).join('');

  iSel.innerHTML = '<option value="">— Sin seguro —</option>'
    + insurances.map(i => `<option value="${i.id}">${esc(i.name)} (${i.coverage_percentage}% cobertura)</option>`).join('');

  // Fecha/hora mínima = ahora
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0); // redondear al siguiente bloque de 30 min
  document.getElementById('na-datetime').value = now.toISOString().slice(0, 16);
  document.getElementById('na-datetime').min   = new Date().toISOString().slice(0, 16);

  document.getElementById('na-form').classList.remove('hidden');
  document.getElementById('na-form').classList.add('flex');
}

async function submitNewAppt() {
  const patientId   = parseInt(document.getElementById('na-patient').value);
  const doctorId    = parseInt(document.getElementById('na-doctor').value);
  const datetime    = document.getElementById('na-datetime').value;   // datetime-local
  const insuranceId = document.getElementById('na-insurance').value;
  const tdesc       = document.getElementById('na-tdesc').value.trim();
  const cost        = parseFloat(document.getElementById('na-cost').value) || 0;
  const paid        = parseFloat(document.getElementById('na-paid').value) || 0;

  clearA('na-alert');
  if (!patientId)  return showA('na-alert', 'na-alert-m', 'Selecciona un paciente.');
  if (!doctorId)   return showA('na-alert', 'na-alert-m', 'Selecciona un médico.');
  if (!datetime)   return showA('na-alert', 'na-alert-m', 'Ingresa la fecha y hora de la cita.');
  if (!tdesc)      return showA('na-alert', 'na-alert-m', 'Ingresa la descripción del tratamiento.');
  if (cost < 0)    return showA('na-alert', 'na-alert-m', 'El costo no puede ser negativo.');
  if (paid < 0)    return showA('na-alert', 'na-alert-m', 'El monto pagado no puede ser negativo.');

  setBtn('na-btn', true, 'Creando cita…');

  const body = {
    patientId,
    doctorId,
    appointmentDate:      datetime,         // ISO con hora → backend valida bloque 30 min
    treatmentDescription: tdesc,
    treatmentCost:        cost,
    amountPaid:           paid,
    // treatmentCode NO se envía → el backend lo genera automáticamente
  };
  if (insuranceId) body.insuranceId = parseInt(insuranceId);

  try {
    await apiFetch('/appointments', { method: 'POST', body: JSON.stringify(body) });
    clMd('new-appt-modal');
    toast('Cita creada exitosamente', 'ok');

    // Refrescar vistas relevantes
    if (_usr?.role === 'admin') {
      loadRev();
      const histEmail = document.getElementById('he').value.trim();
      if (histEmail) loadHist();
    }
    if (_usr?.role === 'patient') loadPatAppts();
    if (window._currentPatientEmail) loadPatientHistoryInDocView(window._currentPatientEmail);

    // Limpiar formulario
    document.getElementById('na-tdesc').value = '';
    document.getElementById('na-cost').value  = '';
    document.getElementById('na-paid').value  = '';
    document.getElementById('na-insurance').value = '';
  } catch (e) {
    showA('na-alert', 'na-alert-m', e.message);
  } finally {
    setBtn('na-btn', false, 'Crear cita');
  }
}

// ══════════════════════════════════════════════════════════════════
// MODAL — DIAGNÓSTICO / EVENTO CLÍNICO (solo doctor)
// ══════════════════════════════════════════════════════════════════

function openAddDiagnosis(email, name) {
  window._diagPatientEmail = email;
  document.getElementById('dg-subtitle').textContent = 'Paciente: ' + name;
  document.getElementById('dg-date').value            = new Date().toISOString().slice(0, 10);
  const sel = document.getElementById('dg-appt');
  sel.innerHTML = '<option value="">— Sin cita específica —</option>';
  clearA('dg-alert');
  document.getElementById('dg-title-field').value  = '';
  document.getElementById('dg-notes').value        = '';
  document.getElementById('dg-prescription').value = '';
  opnMd('diag-modal');
}

async function submitDiagnosis() {
  const email   = window._diagPatientEmail;
  const evtType = document.getElementById('dg-type').value;
  const date    = document.getElementById('dg-date').value;
  const title   = document.getElementById('dg-title-field').value.trim();
  const notes   = document.getElementById('dg-notes').value.trim();
  const rx      = document.getElementById('dg-prescription').value.trim();

  clearA('dg-alert');
  if (!email) return showA('dg-alert', 'dg-alert-m', 'No se pudo identificar el paciente.');
  if (!date)  return showA('dg-alert', 'dg-alert-m', 'Selecciona la fecha del evento.');
  if (!title) return showA('dg-alert', 'dg-alert-m', 'El título / diagnóstico es requerido.');
  if (!notes) return showA('dg-alert', 'dg-alert-m', 'Las notas son requeridas.');

  setBtn('dg-btn', true, 'Guardando…');
  try {
    await apiFetch('/admin/history-event', {
      method: 'POST',
      body: JSON.stringify({
        patientEmail: email,
        eventType:    evtType,
        eventDate:    date,
        title,
        notes,
        prescription: rx || undefined,
      }),
    });
    clMd('diag-modal');
    toast('Evento guardado en el historial del paciente', 'ok');
    await loadPatientHistoryInDocView(email);
  } catch (e) {
    showA('dg-alert', 'dg-alert-m', e.message);
  } finally {
    setBtn('dg-btn', false, 'Guardar en historial');
  }
}

// ══════════════════════════════════════════════════════════════════
// MODAL — ACTIVAR USUARIOS MIGRADOS (admin)
// ══════════════════════════════════════════════════════════════════

async function doRehash() {
  setBtn('rh-btn', true, 'Procesando…');
  document.getElementById('rh-result').classList.add('hidden');
  try {
    const d  = await apiFetch('/admin/rehash-migrated', { method: 'POST' });
    const el = document.getElementById('rh-result');
    el.textContent = d.message;
    el.classList.remove('hidden');
    toast(d.message, 'ok', 5000);
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  } finally {
    setBtn('rh-btn', false, 'Activar todos los usuarios');
  }
}
