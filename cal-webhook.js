const crypto = require('crypto');
const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;
const sha256 = v => v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    if (body.triggerEvent !== 'BOOKING_CREATED') return { statusCode: 200, body: 'ignorado' };

    const att = (body.payload?.attendees || [])[0] || {};
    const payload = {
      data: [{
        event_name: 'Schedule',
        event_time: Math.floor(Date.now() / 1000),
        event_id: 'cal_' + (body.payload?.uid || Date.now()),
        action_source: 'other',
        user_data: {
          em: sha256(att.email),
          ph: att.phone ? sha256(String(att.phone).replace(/\D/g, '')) : undefined
        }
      }]
    };

    await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    return { statusCode: 200, body: 'error silenciado' };
  }
};
