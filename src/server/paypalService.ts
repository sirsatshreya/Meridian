import crypto from 'crypto';

const PAYPAL_SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';

export interface PayPalCreateOrderResult {
  usedLiveApi: boolean;
  paypalOrderId: string;
  approvalUrl: string;
  status: 'BUYER_APPROVAL_REQUIRED';
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRate?: number;
  exchangeRateSource?: string;
  exchangeRateTimestamp?: string;
  rawResponse?: any;
}

export interface PayPalCaptureOrderResult {
  usedLiveApi: boolean;
  paypalCaptureId: string;
  status: 'CAPTURED' | 'PAYMENT_FAILED';
  payerEmail?: string;
  rawResponse?: any;
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal OAuth failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  return data.access_token;
}

export async function fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<{
  rate: number;
  source: string;
  timestamp: string;
} | null> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return null;
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(fromCurrency.toUpperCase())}`);
    if (!res.ok) return null;
    const data: any = await res.json();
    const rate = data?.rates?.[toCurrency.toUpperCase()];
    if (!rate) return null;
    return {
      rate: Number(rate),
      source: 'ExchangeRate-API (open.er-api.com)',
      timestamp: data.time_last_update_utc || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function createLivePayPalSandboxOrder(params: {
  tradeId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayPalCreateOrderResult> {
  // PayPal Sandbox supports USD, EUR, GBP, etc. Convert INR or unsupported currencies to USD if needed
  const supported = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY'];
  let targetCurrency = (params.currency || 'EUR').toUpperCase();
  let targetAmount = Number(params.amount);
  let conversionInfo: {
    convertedAmount?: number;
    convertedCurrency?: string;
    exchangeRate?: number;
    exchangeRateSource?: string;
    exchangeRateTimestamp?: string;
  } = {};

  if (!supported.includes(targetCurrency)) {
    const rateInfo = await fetchExchangeRate(targetCurrency, 'USD');
    if (rateInfo) {
      targetCurrency = 'USD';
      targetAmount = Number((targetAmount * rateInfo.rate).toFixed(2));
      conversionInfo = {
        convertedAmount: targetAmount,
        convertedCurrency: 'USD',
        exchangeRate: rateInfo.rate,
        exchangeRateSource: rateInfo.source,
        exchangeRateTimestamp: rateInfo.timestamp,
      };
    }
  }

  if (!isPayPalConfigured()) {
    const orderId = `PAYPAL-SBX-ORD-${Date.now().toString(36).toUpperCase()}`;
    // In prototype demo mode without live credentials, never construct a fake sandbox.paypal.com URL
    // (which PayPal rejects with "Things don't appear to be working at the moment").
    // Instead route directly to the genuine application return URL with simulated approval params.
    const separator = params.returnUrl.includes('?') ? '&' : '?';
    const simulatedApprovalUrl = `${params.returnUrl}${separator}token=${orderId}&simulated=true`;

    return {
      usedLiveApi: false,
      paypalOrderId: orderId,
      approvalUrl: simulatedApprovalUrl,
      status: 'BUYER_APPROVAL_REQUIRED',
      ...conversionInfo,
    };
  }

  const accessToken = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `mrdn-${params.tradeId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.tradeId,
          description: `Meridian Trade ${params.tradeId} — Sandbox Virtual Payment`,
          amount: {
            currency_code: targetCurrency,
            value: targetAmount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Meridian Trade Systems',
            shipping_preference: 'NO_SHIPPING',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
          },
        },
      },
    }),
  });

  const data: any = await res.json();
  if (!res.ok) {
    const detailedMsg = data?.details?.map((d: any) => `${d.issue}: ${d.description}`).join('; ') || data?.message || `PayPal create order failed (${res.status})`;
    throw new Error(detailedMsg);
  }

  const approveLink = data.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')?.href || '';
  return {
    usedLiveApi: true,
    paypalOrderId: data.id,
    approvalUrl: approveLink,
    status: 'BUYER_APPROVAL_REQUIRED',
    ...conversionInfo,
    rawResponse: data,
  };
}

export async function captureLivePayPalSandboxOrder(paypalOrderId: string): Promise<PayPalCaptureOrderResult> {
  if (!isPayPalConfigured() || paypalOrderId.startsWith('PAYPAL-SBX-ORD-')) {
    return {
      usedLiveApi: false,
      paypalCaptureId: `PAYPAL-SBX-CAP-${Date.now().toString(36).toUpperCase()}`,
      status: 'CAPTURED',
    };
  }

  const accessToken = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data: any = await res.json();
  if (!res.ok) {
    // If order was already captured on PayPal (race condition with webhook)
    const isAlreadyCaptured =
      data?.details?.some((d: any) => d.issue === 'ORDER_ALREADY_CAPTURED') ||
      (data?.name === 'UNPROCESSABLE_ENTITY' && String(data?.message || '').includes('ORDER_ALREADY_CAPTURED'));

    if (isAlreadyCaptured) {
      return {
        usedLiveApi: true,
        paypalCaptureId: `PAYPAL-SBX-CAP-${Date.now().toString(36).toUpperCase()}`,
        status: 'CAPTURED',
        rawResponse: data,
      };
    }

    const detailedMsg = data?.details?.map((d: any) => `${d.issue}: ${d.description}`).join('; ') || data?.message || `PayPal capture failed (${res.status})`;
    throw new Error(detailedMsg);
  }

  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    usedLiveApi: true,
    paypalCaptureId: capture?.id || `CAP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    status: data.status === 'COMPLETED' ? 'CAPTURED' : 'PAYMENT_FAILED',
    payerEmail: data?.payer?.email_address,
    rawResponse: data,
  };
}

export async function verifyPayPalWebhookSignature(headers: Record<string, any>, body: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!isPayPalConfigured() || !webhookId) {
    // When webhook secret isn't configured in prototype mode, allow structural verification
    return true;
  }

  const getHeader = (name: string): string => {
    const val = headers[name.toLowerCase()] || headers[name];
    return Array.isArray(val) ? val[0] : (val || '');
  };

  try {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: getHeader('paypal-auth-algo'),
        cert_url: getHeader('paypal-cert-url'),
        transmission_id: getHeader('paypal-transmission-id'),
        transmission_sig: getHeader('paypal-transmission-sig'),
        transmission_time: getHeader('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });
    const data: any = await res.json();
    return data?.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

