'use strict';

// ── ARRANQUE DE LA APP ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPanelStats();
  if (_tok && _usr) { showApp(); goHome(); }

  // Atajos de teclado globales
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      clMd('dm');
      clMd('new-appt-modal');
      clMd('rehash-modal');
      clMd('diag-modal');
      clSB();
    }
  });

  // Enter en formulario de login
  document.getElementById('le').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('lp').focus();
  });
  document.getElementById('lp').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Enter en formulario de registro
  document.getElementById('rn').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('re').focus();
  });
  document.getElementById('re').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('rp').focus();
  });
  document.getElementById('rp').addEventListener('keydown', e => {
    if (e.key === 'Enter') doRegister();
  });
});
