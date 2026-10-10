'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DRAFT_KEY = 'qubators-add-draft';

export default function AddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    productName: '',
    totalAmount: '',
    qty: '1',
    variation: '',
    deliveryInfo: '',
    followUpDate: '',
    followUpReason: '',
    notes: ''
  });
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<{ name: string; priceKobo: number; variations: string | null }[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setCatalog(d.products ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const prefill = searchParams.get('customer');
      if (raw) {
        const draft = JSON.parse(raw);
        // URL prefill wins for a fresh "+ New order for X" flow
        if (prefill && !draft.customerName) draft.customerName = prefill;
        setForm((f) => ({ ...f, ...draft }));
      } else if (prefill) {
        setForm((f) => ({ ...f, customerName: prefill }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Catalog match: exact product name fills price (× qty) + opens variations
      if (k === 'productName') {
        const hit = catalog.find((p) => p.name.toLowerCase() === v.trim().toLowerCase());
        if (hit) {
          const qty = Number(next.qty) || 1;
          next.totalAmount = String(Math.round((hit.priceKobo * qty) / 100));
          if (hit.variations) setShowMore(true);
        }
      }
      if (k === 'qty') {
        const hit = catalog.find((p) => p.name.toLowerCase() === next.productName.trim().toLowerCase());
        if (hit) next.totalAmount = String(Math.round((hit.priceKobo * (Number(v) || 1)) / 100));
      }
      return next;
    });
  }

  const matchedVars = (() => {
    const hit = catalog.find((p) => p.name.toLowerCase() === form.productName.trim().toLowerCase());
    if (!hit?.variations) return [];
    return hit.variations.split(',').map((s) => s.trim()).filter(Boolean);
  })();

  async function save() {
    setError('');
    if (!form.customerName.trim() || !form.productName.trim() || !form.totalAmount.trim()) {
      setError('Name, product and total are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          productName: form.productName,
          totalAmount: form.totalAmount,
          qty: Number(form.qty) || 1,
          variation: form.variation,
          deliveryInfo: form.deliveryInfo,
          followUpDate: form.followUpDate || undefined,
          followUpReason: form.followUpReason,
          notes: form.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/orders/${data.order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed — draft kept, try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">+ Add Order</h1>
      <p className="text-xs font-bold text-gray-600">30 seconds. Only 3 fields required *</p>

      <input
        className="w-full p-3 mt-3 rounded-2xl border-2 border-ink font-semibold bg-white"
        placeholder="Customer name *"
        value={form.customerName}
        onChange={(e) => set('customerName', e.target.value)}
      />
      <input
        list="catalog-products"
        className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold bg-white"
        placeholder="Product / item * (pick from catalog or type new)"
        value={form.productName}
        onChange={(e) => set('productName', e.target.value)}
      />
      <datalist id="catalog-products">
        {catalog.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>
      <div className="mt-1 text-right">
        <a href="/products" className="text-xs font-extrabold underline">Manage products →</a>
      </div>
      <input
        className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold bg-[#F3E8FF]"
        placeholder="₦ Total amount *"
        inputMode="numeric"
        value={form.totalAmount}
        onChange={(e) => set('totalAmount', e.target.value)}
      />

      <button
        className="mt-2 text-sm font-extrabold underline"
        onClick={() => setShowMore((s) => !s)}
      >
        {showMore ? 'Hide details ▲' : 'More details (optional) ▼'}
      </button>

      {showMore && (
        <div className="mt-2 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
          <input className="w-full p-3 rounded-2xl border-2 border-ink mb-2" placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <div className="flex gap-2">
            <input className="w-1/2 p-3 rounded-2xl border-2 border-ink" placeholder="Qty" inputMode="numeric" value={form.qty} onChange={(e) => set('qty', e.target.value)} />
            <input className="w-1/2 p-3 rounded-2xl border-2 border-ink" placeholder="Variation S/M/L" value={form.variation} onChange={(e) => set('variation', e.target.value)} />
          </div>
          {matchedVars.length > 0 && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {matchedVars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('variation', v)}
                  className={`text-xs font-extrabold px-2.5 py-1.5 rounded-full border-2 border-ink ${form.variation === v ? 'bg-ink text-white' : 'bg-white'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <input className="w-full p-3 rounded-2xl border-2 border-ink mt-2" placeholder="Delivery (e.g. Ikeja)" value={form.deliveryInfo} onChange={(e) => set('deliveryInfo', e.target.value)} />
          <input className="w-full p-3 rounded-2xl border-2 border-ink mt-2" type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
          <input className="w-full p-3 rounded-2xl border-2 border-ink mt-2" placeholder="Follow-up reason" value={form.followUpReason} onChange={(e) => set('followUpReason', e.target.value)} />
          <input className="w-full p-3 rounded-2xl border-2 border-ink mt-2" placeholder="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      )}

      {error && <p className="mt-3 text-sm font-bold text-[#FF2D55]">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Order'}
      </button>
    </main>
  );
}
