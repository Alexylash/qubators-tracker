import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/queries';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, customer } = await createOrder({
      customerName: body.customerName,
      phone: body.phone,
      productName: body.productName,
      totalAmount: body.totalAmount,
      qty: body.qty ? Number(body.qty) : 1,
      variation: body.variation,
      deliveryInfo: body.deliveryInfo,
      followUpDate: body.followUpDate,
      followUpReason: body.followUpReason,
      notes: body.notes,
      source: body.source
    });
    return NextResponse.json({ order, customer }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save order';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
