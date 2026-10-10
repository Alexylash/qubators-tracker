import { NextResponse } from 'next/server';
import { getOrderWithCustomer, updateOrder } from '@/lib/queries';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getOrderWithCustomer(params.id);
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateOrder(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update order';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
