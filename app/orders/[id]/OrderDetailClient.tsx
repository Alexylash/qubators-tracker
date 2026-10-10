'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderPill, PaymentBadge } from '@/components/ui/StatusPill';
import { koboToNaira, koboBalance } from '@/lib/format';
import { waLink as buildWaLink } from '@/lib/whatsapp';

const FLOW = ['new', 'confirmed', 'processing', 'delivered'];
const PAYMENTS = ['pending', 'partial', 'paid', 'refunded'];

function proofUrl(key: string): string {
  if (key.startsWith('http')) return key;
  if (key.startsWith('uploads/')) return `/api/files/${key}`;
  return key;
}

export default function OrderDetailClient({ data }: { data: any }) {
  const router = useRouter();
  const [order, setOrder] = useState(data.order);
  const [paidInput, setPaidInput] = useState('');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const customer = data.customer;

  async function patch(body: Record<string, unknown>) {
    setMsg('');
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Update failed');
      return;
    }
    setOrder(json.order);
    router.refresh();
  }

  async function uploadProof(file: File) {
    setMsg('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const ujson = await up.json();
      if (!up.ok) throw new Error(ujson.error || 'Upload failed');
      await patch({ proofR2Key: ujson.key });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const waLink = buildWaLink(
    customer?.phone,
    `Hello ${customer?.name}, update on your order (${order.productName}) — ${koboToNaira(order.totalAmount)}, ${order.paymentStatus}.`
  );

  return (
    <main className="p-4">
      <a href="/" className="text-sm font-extrabold underline">← Home</a>
      <h1 className="mt-1 text-xl font-extrabold">{customer?.name ?? 'Order'}</h1>
      <div className="mt-2 flex gap-2 flex-wrap">
        <OrderPill status={order.orderStatus} />
      </div>
      <div className="mt-1">
        <PaymentBadge status={order.paymentStatus} amount={koboToNaira(order.totalAmount)} />
      </div>

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
        <b className="text-sm">WHO</b>
        <p className="font-semibold">{customer?.name} • {customer?.phone || 'no phone'}</p>
        {waLink && (
          <a href={waLink} target="_blank" className="inline-block mt-2 bg-[#1FDB63] font-extrabold px-4 py-2 rounded-2xl border-2 border-ink">
            WhatsApp →
          </a>
        )}
      </div>

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
        <b className="text-sm">WHAT</b>
        <p className="font-semibold">{order.productName} × {order.qty}{order.variation ? ` (${order.variation})` : ''}</p>
        <b className="text-sm mt-2 block">HOW MUCH</b>
        <p>Total {koboToNaira(order.totalAmount)} • Paid {koboToNaira(order.amountPaid)} • Balance {koboToNaira(koboBalance(order.totalAmount, order.amountPaid))}</p>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 p-2 rounded-xl border-2 border-ink"
            placeholder="₦ Amount paid"
            inputMode="numeric"
            value={paidInput}
            onChange={(e) => setPaidInput(e.target.value)}
          />
          <button
            className="bg-ink text-white font-bold px-3 rounded-xl"
            onClick={() => paidInput.trim() && patch({ amountPaid: paidInput })}
          >
            Set paid
          </button>
        </div>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {PAYMENTS.map((p) => (
            <button
              key={p}
              onClick={() => patch({ paymentStatus: p })}
              className={`text-xs font-extrabold px-2.5 py-1.5 rounded-full border-2 border-ink ${order.paymentStatus === p ? 'bg-ink text-white' : 'bg-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <b className="text-sm">PAYMENT PROOF</b>
          {order.proofR2Key ? (
            <p className="mt-1">
              <a href={proofUrl(order.proofR2Key)} target="_blank" className="font-bold underline">
                View proof →
              </a>
            </p>
          ) : (
            <p className="text-xs font-semibold text-gray-600">No proof attached.</p>
          )}
          <div className="flex gap-2 mt-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="flex-1 text-xs font-bold"
              onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])}
            />
          </div>
          {uploading && <p className="text-xs font-bold mt-1">Uploading…</p>}
        </div>
      </div>

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
        <b className="text-sm">WHERE / WHEN</b>
        <p className="font-semibold">Delivery: {order.deliveryInfo || '—'}</p>
        <p className="font-semibold">Follow-up: {order.followUpDate || '—'} {order.followUpReason ? `(${order.followUpReason})` : ''}</p>
      </div>

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
        <b className="text-sm">WHAT'S NEXT</b>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {FLOW.map((s) => (
            <button
              key={s}
              onClick={() => patch({ orderStatus: s })}
              className={`text-xs font-extrabold px-2.5 py-1.5 rounded-full border-2 border-ink ${order.orderStatus === s ? 'bg-brand text-white' : 'bg-white'}`}
            >
              {s}
            </button>
          ))}
          <button onClick={() => patch({ orderStatus: 'cancelled' })} className="text-xs font-extrabold px-2.5 py-1.5 rounded-full border-2 border-ink bg-white">
            cancel
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-sm font-bold text-[#FF2D55]">{msg}</p>}
    </main>
  );
}
