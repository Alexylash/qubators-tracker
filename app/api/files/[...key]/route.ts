import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSellerId } from '@/lib/seller';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

// Serves local-fallback uploads (public/uploads/<sellerId>/...) with seller check.
// R2 keys are served from R2_PUBLIC_URL directly and never hit this route.
export async function GET(_: Request, { params }: { params: { key: string[] } }) {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rel = params.key.join('/');
  if (!rel.startsWith(`uploads/${sellerId}/`) || rel.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const buf = await readFile(join(process.cwd(), 'public', ...rel.split('/')));
    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': TYPES[ext] ?? 'application/octet-stream' }
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
