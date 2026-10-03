/* =====================================================================
   tracking.js — Simón Castro Fotógrafo
   Reglas de eventos de Meta (Pixel 1419735723401028):

   • Botones a WhatsApp  → "Contact"  (UNA sola vez por navegador, aunque
                            toque otro botón o vuelva otro día)
   • data-evento="interaccion" → "Interaccion" (plan armado / ir al portafolio)
   • data-evento="ninguno"     → no dispara nada
   • Contrato firmado y enviado → "Lead" + "ClienteFinalizado"
   • Ningún botón dispara "SubscribedButtonClick" (se apaga con
     autoConfig=false en el código del pixel de cada página).
   ===================================================================== */
(function () {
  'use strict';

  // ---- Nombres de eventos (si quieres cambiar alguno, es solo aquí) ----
  var EVENTO_CONTACTO    = 'Contact';          // evento estándar de Meta
  var EVENTO_INTERACCION = 'Interaccion';      // evento personalizado
  var EVENTO_FINALIZADO  = 'ClienteFinalizado';// evento personalizado
  var KEY_CONTACTO       = 'sc_contacto_enviado';

  function px(tipo, nombre, params) {
    try {
      if (typeof window.fbq === 'function') { window.fbq(tipo, nombre, params || {}); return true; }
    } catch (e) {}
    return false;
  }

  // ---- Memoria "ya marcó Contacto" (localStorage + cookie de respaldo) ----
  function yaMarcoContacto() {
    try { if (localStorage.getItem(KEY_CONTACTO) === '1') return true; } catch (e) {}
    return document.cookie.indexOf(KEY_CONTACTO + '=1') !== -1;
  }
  function recordarContacto() {
    try { localStorage.setItem(KEY_CONTACTO, '1'); } catch (e) {}
    try { document.cookie = KEY_CONTACTO + '=1; max-age=31536000; path=/; SameSite=Lax'; } catch (e) {}
  }

  function contacto() {
    if (yaMarcoContacto()) return;
    if (px('track', EVENTO_CONTACTO)) recordarContacto();
  }

  function interaccion(params) {
    px('trackCustom', EVENTO_INTERACCION, params);
  }

  var contratoEnviado = false;
  function contratoFirmado() {
    if (contratoEnviado) return;
    contratoEnviado = true;
    px('track', 'Lead');
    px('trackCustom', EVENTO_FINALIZADO);
  }

  function esWhatsApp(a) {
    var h = (a.hostname || '').toLowerCase();
    return h === 'wa.me' || h === 'api.whatsapp.com' || h === 'web.whatsapp.com' || h === 'wa.link';
  }

  // Un solo escuchador para toda la página
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    var modo = a.getAttribute('data-evento');
    if (modo === 'ninguno') return;

    if (modo === 'interaccion') {
      if (a.classList.contains('disabled')) return;      // botón del plan aún sin armar
      var total = parseInt(a.getAttribute('data-total') || (a.dataset && a.dataset.total) || '0', 10);
      interaccion(total > 0 ? { value: total, currency: 'COP' } : undefined);
      return;
    }

    if (esWhatsApp(a)) contacto();
  }, true);

  window.simonTrack = {
    contacto: contacto,
    interaccion: interaccion,
    contratoFirmado: contratoFirmado
  };
})();
