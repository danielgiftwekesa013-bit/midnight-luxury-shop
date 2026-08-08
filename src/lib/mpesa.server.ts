/**
 * Safaricom Daraja (M-Pesa STK Push) service layer.
 *
 * Credentials are NOT bundled with the app. Connect them later as backend
 * secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE,
 * MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENV ("sandbox" | "production").
 *
 * Until they exist, STK push returns a `failed` state with a clear reason.
 * Payment success is NEVER decided by the client — the order's payment_status
 * in the database is the only source of truth, and it is written by the
 * Daraja callback endpoint (src/routes/api/public/mpesa/callback.ts).
 */

export type DarajaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  baseUrl: string;
};

export function readDarajaConfig(): DarajaConfig | null {
  const consumerKey = process.env["MPESA_CONSUMER_KEY"];
  const consumerSecret = process.env["MPESA_CONSUMER_SECRET"];
  const shortcode = process.env["MPESA_SHORTCODE"];
  const passkey = process.env["MPESA_PASSKEY"];
  const callbackUrl = process.env["MPESA_CALLBACK_URL"];
  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) return null;
  const baseUrl =
    process.env["MPESA_ENV"] === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  return { consumerKey, consumerSecret, shortcode, passkey, callbackUrl, baseUrl };
}

async function getAccessToken(cfg: DarajaConfig): Promise<string> {
  const basic = btoa(`${cfg.consumerKey}:${cfg.consumerSecret}`);
  const res = await fetch(`${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error("Could not authenticate with M-Pesa");
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export async function stkPush(args: {
  cfg: DarajaConfig;
  phone: string;
  amount: number;
  reference: string;
}): Promise<{ merchantRequestId: string; checkoutRequestId: string }> {
  const { cfg, phone, amount, reference } = args;
  const token = await getAccessToken(cfg);
  const ts = timestamp();
  const password = btoa(`${cfg.shortcode}${cfg.passkey}${ts}`);

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: cfg.shortcode,
      PhoneNumber: phone,
      CallBackURL: cfg.callbackUrl,
      AccountReference: reference,
      TransactionDesc: reference,
    }),
  });

  const json = (await res.json()) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    errorMessage?: string;
  };
  if (!res.ok || !json.CheckoutRequestID) {
    throw new Error(json.errorMessage ?? "M-Pesa request was rejected");
  }
  return {
    merchantRequestId: json.MerchantRequestID ?? "",
    checkoutRequestId: json.CheckoutRequestID,
  };
}
