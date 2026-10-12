// Paystack (test mode first). Server-side only — never import from client components.
// Paystack money is integer kobo, same as our DB. No conversion needed.

const API = 'https://api.paystack.co';

function secret(): string {
  const s = process.env.PAYSTACK_SECRET_KEY;
  if (!s) throw new Error('Add PAYSTACK_SECRET_KEY to .env.local, then restart (pnpm dev).');
  return s;
}

export type VerifyResult = {
  ok: boolean;
  status: string; // 'success' means money moved
  amountKobo: number;
  currency: string;
  reference: string;
  channel?: string;
  paidAt?: string;
  customerEmail?: string;
};

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const ref = reference.trim();
  if (!ref) throw new Error('Paystack reference required.');
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${secret()}` }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.status) {
    throw new Error(body?.message || `Paystack verify failed (${res.status}). Check the reference.`);
  }
  const d = body.data ?? {};
  return {
    ok: d.status === 'success',
    status: d.status ?? 'unknown',
    amountKobo: typeof d.amount === 'number' ? d.amount : 0,
    currency: d.currency ?? '',
    reference: d.reference ?? ref,
    channel: d.channel,
    paidAt: d.paid_at,
    customerEmail: d.customer?.email
  };
}

export async function initializeTransaction(input: { email: string; amountKobo: number; reference?: string; metadata?: Record<string, unknown> }) {
  if (!input.email.trim()) throw new Error('Customer email required for Paystack checkout.');
  if (input.amountKobo <= 0) throw new Error('Amount must be above ₦0.');
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email.trim(),
      amount: input.amountKobo,
      reference: input.reference || undefined,
      metadata: input.metadata
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.status) throw new Error(body?.message || 'Paystack initialize failed.');
  return {
    authorizationUrl: body.data.authorization_url as string,
    reference: body.data.reference as string
  };
}
