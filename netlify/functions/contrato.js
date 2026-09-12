// netlify/functions/contrato.js
// Envía por correo el PDF del contrato firmado usando Resend (https://resend.com).
// No necesita ninguna librería instalada: usa fetch, que ya viene incluido en las
// funciones de Netlify (Node 18+).
//
// Variables de entorno requeridas en Netlify (Site configuration → Environment variables):
//   RESEND_API_KEY   → la clave que te da Resend (empieza con "re_")
//   FROM_EMAIL       → el remitente verificado, ej: "Simón Castro Fotógrafo <contrato@simoncastrofotografo.com>"
//
// IMPORTANTE: para poder enviar a los correos reales de tus clientes (no solo al tuyo),
// tienes que verificar tu dominio simoncastrofotografo.com dentro de Resend
// (Resend → Domains → Add Domain → te da unos registros DNS para agregar).
// Mientras el dominio no esté verificado, Resend solo deja enviar correos a la
// dirección con la que te registraste en Resend.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Simón Castro Fotógrafo <onboarding@resend.dev>';

const emailValido = v => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ enviado: false, error: 'Método no permitido' }) };
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('Falta la variable de entorno RESEND_API_KEY en Netlify');
    }

    const body = JSON.parse(event.body || '{}');
    const { toClient, toOwner, nombreCliente, quinceanera, fechaEvento, pdfBase64, archivo } = body;

    if (!emailValido(toClient)) throw new Error('Email del cliente inválido o vacío');
    if (!pdfBase64) throw new Error('No llegó el PDF a enviar');

    const nombreArchivo = String(archivo || 'Contrato.pdf').replace(/[^a-z0-9._-]+/gi, '_');
    const destinatarios = [toClient];
    const bcc = emailValido(toOwner) ? [toOwner] : undefined;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: destinatarios,
        bcc,
        subject: `Tu contrato firmado — Sesión de ${quinceanera || 'Quince Años'}`,
        html: `
          <p>Hola ${nombreCliente || ''},</p>
          <p>Adjunto encontrarás la copia de tu contrato firmado para la sesión de <b>${quinceanera || ''}</b>${fechaEvento ? ` el ${fechaEvento}` : ''}.</p>
          <p>Gracias por confiar en Simón Castro Fotógrafo. ¡Nos vemos pronto!</p>
        `,
        attachments: [{
          filename: nombreArchivo,
          content: pdfBase64
        }]
      })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(data?.message || `Resend respondió con estado ${resp.status}`);
    }

    return { statusCode: 200, body: JSON.stringify({ enviado: true }) };
  } catch (e) {
    console.error('Error enviando contrato:', e);
    return { statusCode: 200, body: JSON.stringify({ enviado: false, error: e.message }) };
  }
};
