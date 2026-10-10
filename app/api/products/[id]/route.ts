import { NextResponse } from 'next/server';
import { updateProduct } from '@/lib/queries';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const product = await updateProduct(params.id, body);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update product';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const product = await updateProduct(params.id, { active: false });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
