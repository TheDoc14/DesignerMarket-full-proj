// back-end/utils/paypal.utils.js
const getPaypalBaseUrl = () => {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
};

const getAccessToken = async () => {
  const baseUrl = getPaypalBaseUrl();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) throw new Error('PayPal credentials missing');

  const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error('PayPal auth failed');

  return data.access_token;
};

const createPaypalOrder = async ({ currency, value, returnUrl, cancelUrl }) => {
  const baseUrl = getPaypalBaseUrl();
  const accessToken = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: currency, value: String(value.toFixed(2)) },
        },
      ],
      // ✅ זה החלק שחסר לך וגורם ללופ
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        shipping_preference: 'NO_SHIPPING', // דיגיטלי = בלי כתובת
        user_action: 'PAY_NOW', // מצמצם שלב “Review”
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error('PayPal create order failed');

  const approveLink = Array.isArray(data.links)
    ? data.links.find((l) => l.rel === 'approve')?.href
    : undefined;

  return { paypalOrderId: data.id, approveLink };
};

const capturePaypalOrder = async (paypalOrderId) => {
  const baseUrl = getPaypalBaseUrl();
  const accessToken = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error('PayPal capture failed');

  // נחלץ captureId אם קיים
  const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';

  return { status: data.status, captureId };
};

const sendPayout = async ({ receiverEmail, currency, value, note }) => {
  const baseUrl = getPaypalBaseUrl();
  const accessToken = await getAccessToken();

  const batchId = `DM-${Date.now()}`;

  const res = await fetch(`${baseUrl}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: 'You received a payout',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          receiver: receiverEmail,
          note: note || 'Designer Market payout',
          sender_item_id: `${batchId}-1`,
          amount: { currency, value: String(value.toFixed(2)) },
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error('PayPal payout failed');

  const payoutBatchId = data?.batch_header?.payout_batch_id || '';
  const payoutItemId = data?.items?.[0]?.payout_item_id || '';

  return { payoutBatchId, payoutItemId };
};

module.exports = { createPaypalOrder, capturePaypalOrder, sendPayout };
