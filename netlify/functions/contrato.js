// Envía por correo el PDF del contrato firmado: al cliente (con copia oculta al fotógrafo).
// Requiere dos variables de entorno en Netlify (Site configuration → Environment variables):
//   GMAIL_USER          → simoncastrofotografo@gmail.com
//   GMAIL_APP_PASSWORD  → contraseña de aplicación de 16 caracteres (no la contraseña normal de Gmail)
//
// Cómo generar la contraseña de aplicación:
//   1. myaccount.google.com/security → activar "Verificación en 2 pasos" (si no está activa).
//   2. Buscar "Contraseñas de aplicaciones" → crear una nueva → app "Correo".
//   3. Copiar el código de 16 letras (sin espacios) y pegarlo como GMAIL_APP_PASSWORD.

const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const emailValido = v => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ enviado: false, error: 'Método no permitido' }) };
  }

  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error('Faltan las variables de entorno GMAIL_USER / GMAIL_APP_PASSWORD en Netlify');
    }

    const body = JSON.parse(event.body || '{}');
    const { toClient, toOwner, nombreCliente, quinceanera, fechaEvento, pdfBase64, archivo } = body;

    if (!emailValido(toClient)) throw new Error('Email del cliente inválido o vacío');
    if (!pdfBase64) throw new Error('No llegó el PDF a enviar');

    const nombreArchivo = String(archivo || 'Contrato.pdf').replace(/[^a-z0-9._-]+/gi, '_');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `"Simón Castro Fotógrafo" <${GMAIL_USER}>`,
      to: toClient,
      bcc: emailValido(toOwner) ? toOwner : GMAIL_USER,
      subject: `Tu contrato firmado — Sesión de ${quinceanera || 'Quince Años'}`,
      html: `
        <p>Hola ${nombreCliente || ''},</p>
        <p>Adjunto encontrarás la copia de tu contrato firmado para la sesión de <b>${quinceanera || ''}</b>${fechaEvento ? ` el ${fechaEvento}` : ''}.</p>
        <p>Gracias por confiar en Simón Castro Fotógrafo. ¡Nos vemos pronto!</p>
      `,
      attachments: [{
        filename: nombreArchivo,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }]
    });

    return { statusCode: 200, body: JSON.stringify({ enviado: true }) };
  } catch (e) {
    console.error('Error enviando contrato:', e);
    return { statusCode: 200, body: JSON.stringify({ enviado: false, error: e.message }) };
  }
};
