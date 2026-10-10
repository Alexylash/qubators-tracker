'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { koboToNaira } from '@/lib/format';
import { waLink as buildWaLink } from '@/lib/whatsapp';

export default function FollowupRow({
  order,
  customerName,
  customerPhone
}: {
  order: { id: string; productName: string; totalAmount: number; followUpDate: string | null; followUpReason: string | null };
  customerName: string;
  customerPhone: string | null;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const wa = buildWaLink(
    customerPhone,
    `Hello ${customerName}, following up on ${order.productName} (${koboToNaira(order.totalAmount)}).`
  );

  async function markDone() {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpDate: '', followUpReason: '' })
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) return null;

  return (
    <div className="bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2">
      <b>{customerName}</b>
      <span className="text-xs font-bold text-gray-600"> • {order.followUpReason || 'Follow up'} • {order.followUpDate}</span>
      <div className="text-sm font-semibold">
        <Link href={`/orders/${order.id}`} className="underline">{order.productName}</Link> • {koboToNaira(order.totalAmount)}
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={markDone} className="flex-1 bg-ink text-white font-extrabold p-2.5 rounded-xl">
          Mark done ✓
        </button>
        {wa && (
          <a href={wa} target="_blank" className="flex-1 text-center bg-[#1FDB63] font-extrabold p-2.5 rounded-xl border-2 border-ink">
            WhatsApp →
          </a>
        )}
      </div>
    </div>
  );
}
