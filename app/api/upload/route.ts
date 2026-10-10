import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { r2, R2_BUCKET } from '@/lib/r2';
import { getSellerId } from '@/lib/seller';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPG/PNG/WebP' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });

  const safe = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (r2) {
    const key = `proofs/${sellerId}/${safe}`;
    await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: bytes, ContentType: file.type }));
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
    return NextResponse.json({ key, url: base ? `${base}/${key}` : key });
  }

  // Local fallback (R2 keys blank): store under public/uploads (gitignored)
  const dir = join(process.cwd(), 'public', 'uploads', sellerId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, safe), bytes);
  const key = `uploads/${sellerId}/${safe}`;
  return NextResponse.json({ key, url: `/${key}` });
}
