import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSellerId } from '@/lib/seller';
import { r2, R2_BUCKET } from '@/lib/r2';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function contentType(rel: string, fallback?: string): string {
  if (fallback) return fallback;
  const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
  return TYPES[ext] ?? 'application/octet-stream';
}

// Serves proof files with seller check, from R2 (proofs/<sellerId>/...) or
// local fallback (public/uploads/<sellerId>/...). Works with private buckets.
export async function GET(_: Request, { params }: { params: { key: string[] } }) {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rel = params.key.join('/');
  if (rel.includes('..')) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // R2-hosted proof: proofs/<sellerId>/<file>
  if (rel.startsWith('proofs/')) {
    const parts = rel.split('/');
    if (!r2 || parts[1] !== sellerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    try {
      const out = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: rel }));
      const bytes = await out.Body!.transformToByteArray();
      const copy = new Uint8Array(bytes);
      return new Response(copy, {
        headers: { 'Content-Type': contentType(rel, out.ContentType) }
      });
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // Local fallback
  if (!rel.startsWith(`uploads/${sellerId}/`)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const buf = await readFile(join(process.cwd(), 'public', ...rel.split('/')));
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': contentType(rel) }
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
