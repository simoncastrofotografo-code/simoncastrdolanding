/* Meta Pixel events — Simón Castro Fotógrafo
   Contact: every WhatsApp click except explicitly interaction-only CTAs.
   Interaccion: meaningful engagement and the plan calculator.
   ClienteFinalizado: only after the contract is signed and its PDF is generated.
   SubscribedButtonClick is never sent by this script.
*/
(function () {
  'use strict';
  var EVENTO_CONTACTO = 'Contact';
  var EVENTO_INTERACCION = 'Interaccion';
  var EVENTO_FINALIZADO = 'ClienteFinalizado';

  function px(tipo, nombre, params) {
    try {
      if (typeof window.fbq === 'function') {
        window.fbq(tipo, nombre, params || {});
        return true;
      }
    } catch (e) {}
    return false;
  }
  function contacto() { px('track', EVENTO_CONTACTO); }
  function interaccion(params) { px('trackCustom', EVENTO_INTERACCION, params); }

  var contratoEnviado = false;
  function contratoFirmado() {
    if (contratoEnviado) return;
    contratoEnviado = true;
    // Single custom event to avoid double-counting a standard Lead as well.
    px('trackCustom', EVENTO_FINALIZADO);
  }
  function esWhatsApp(a) {
    try {
      var u = new URL(a.href, window.location.href);
      var h = (u.hostname || '').toLowerCase();
      return h === 'wa.me' || h === 'api.whatsapp.com' || h === 'web.whatsapp.com' || h === 'wa.link';
    } catch (e) { return false; }
  }

  function marcarInteraccionContrato() {
    if (document.body && document.body.classList.contains('pagina-contrato') && !window.__scContratoInteraccion) {
      window.__scContratoInteraccion = true;
      interaccion({ area: 'contrato' });
    }
  }
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input, textarea, select, button, canvas, [role="checkbox"]')) marcarInteraccionContrato();
  }, true);

  document.addEventListener('click', function (e) {
    var target = e.target;
    var a = target && target.closest ? target.closest('a') : null;

    // In the contract, record the first meaningful interaction with the form.
    if (document.body && document.body.classList.contains('pagina-contrato')) {
      var control = target && target.closest ? target.closest('input, textarea, select, button, canvas, label, [role="checkbox"]') : null;
      if (control) marcarInteraccionContrato();
    }
    if (!a) return;
    var modo = a.getAttribute('data-evento');
    if (modo === 'ninguno') return;
    if (modo === 'interaccion') {
      if (a.classList.contains('disabled')) return;
      var total = parseInt(a.getAttribute('data-total') || (a.dataset && a.dataset.total) || '0', 10);
      interaccion(total > 0 ? { value: total, currency: 'COP', area: 'plan' } : { area: 'sitio' });
      return; // explicitly interaction-only, even when the URL is WhatsApp
    }
    if (esWhatsApp(a)) contacto();
  }, true);

  window.simonTrack = { contacto: contacto, interaccion: interaccion, contratoFirmado: contratoFirmado };
})();
