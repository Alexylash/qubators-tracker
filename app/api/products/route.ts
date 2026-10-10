import { NextResponse } from 'next/server';
import { createProduct, listProducts } from '@/lib/queries';

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get('q') ?? undefined;
    return NextResponse.json({ products: await listProducts(q) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await createProduct({ name: body.name, price: body.price, variations: body.variations });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save product';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
