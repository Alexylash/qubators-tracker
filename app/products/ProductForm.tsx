'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [variations, setVariations] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setError('');
    if (!name.trim() || !price.trim()) {
      setError('Name and price required.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, variations })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setName('');
      setPrice('');
      setVariations('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
      <b className="text-sm">+ NEW PRODUCT</b>
      <input className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold" placeholder="Name * e.g. Classic Black T-Shirt" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2 mt-2">
        <input className="w-1/2 p-3 rounded-2xl border-2 border-ink font-semibold bg-[#F3E8FF]" placeholder="₦ Price *" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className="w-1/2 p-3 rounded-2xl border-2 border-ink font-semibold" placeholder="Sizes S,M,L,XL" value={variations} onChange={(e) => setVariations(e.target.value)} />
      </div>
      {error && <p className="mt-2 text-sm font-bold text-[#FF2D55]">{error}</p>}
      <button onClick={save} disabled={busy} className="w-full mt-2 bg-brand text-white font-extrabold p-3 rounded-2xl border-2 border-ink shadow-hard disabled:opacity-50">
        {busy ? 'Saving…' : 'Save product'}
      </button>
    </div>
  );
}
