'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductRow({
  product
}: {
  product: { id: string; name: string; priceKobo: number; variations: string | null; priceLabel: string };
}) {
  const router = useRouter();
  const [gone, setGone] = useState(false);
  if (gone) return null;

  async function remove() {
    if (!confirm(`Remove ${product.name} from catalog?`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) {
      setGone(true);
      router.refresh();
    }
  }

  return (
    <div className="bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2 flex items-center gap-2">
      <div className="flex-1">
        <b>{product.name}</b>
        <div className="text-sm font-bold">
          {product.priceLabel}
          {product.variations && <span className="text-gray-600"> • {product.variations}</span>}
        </div>
      </div>
      <button onClick={remove} className="text-xs font-extrabold px-3 py-2 rounded-full border-2 border-ink bg-white">
        Remove
      </button>
    </div>
  );
}
