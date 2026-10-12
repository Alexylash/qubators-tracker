import { NextResponse } from 'next/server';
import { getOrderWithCustomer, updateOrder } from '@/lib/queries';
import { verifyTransaction } from '@/lib/paystack';

// Seller pastes the Paystack reference from the customer's receipt.
// We verify with Paystack, then record what actually arrived (kobo).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const reference = (body.reference as string | undefined)?.trim();
    if (!orderId || !reference) {
      return NextResponse.json({ error: 'Order and Paystack reference required.' }, { status: 400 });
    }
    const current = await getOrderWithCustomer(orderId);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const v = await verifyTransaction(reference);
    if (!v.ok) {
      return NextResponse.json(
        { error: `Paystack says: ${v.status}. Money has not moved yet — ask the customer to complete payment.`, paystackStatus: v.status },
        { status: 400 }
      );
    }
    if (v.currency && v.currency !== 'NGN') {
      return NextResponse.json({ error: `Expected NGN, got ${v.currency}.` }, { status: 400 });
    }

    const updated = await updateOrder(orderId, {
      amountPaidKobo: v.amountKobo,
      paystackRef: v.reference
    });
    return NextResponse.json({
      order: updated,
      receivedKobo: v.amountKobo,
      reference: v.reference,
      channel: v.channel,
      paidAt: v.paidAt
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
