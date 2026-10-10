export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { listProducts } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';
import ProductForm from './ProductForm';
import ProductRow from './ProductRow';

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await requireUser())) redirect('/login');
  const q = searchParams.q ?? '';
  const items = await listProducts(q);

  return (
    <main className="p-4">
      <Link href="/" className="text-sm font-extrabold underline">← Home</Link>
      <h1 className="mt-1 text-xl font-extrabold">Products ⚡</h1>
      <p className="text-sm font-semibold text-gray-600">Save once, pick in seconds when adding orders.</p>

      <ProductForm />

      <form method="GET" action="/products" className="mt-3 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="flex-1 p-3 rounded-2xl border-2 border-ink font-semibold bg-white"
        />
        <button className="bg-ink text-white font-extrabold px-4 rounded-2xl">Go</button>
      </form>

      {items.length === 0 ? (
        <div className="mt-3 text-center p-6 border-2 border-dashed border-ink rounded-2xl bg-[#E0F7FF] font-bold">
          No products yet. Add your best sellers above.
        </div>
      ) : (
        <div className="mt-3">
          {items.map((p) => (
            <ProductRow
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                priceKobo: p.priceKobo,
                variations: p.variations,
                priceLabel: koboToNaira(p.priceKobo)
              }}
            />
          ))}
        </div>
      )}

      <nav className="mt-4 bg-ink text-white flex rounded-2xl overflow-hidden border-2 border-ink font-bold text-xs">
        <Link href="/" className="flex-1 text-center p-3">Home</Link>
        <Link href="/orders" className="flex-1 text-center p-3">Orders</Link>
        <Link href="/customers" className="flex-1 text-center p-3">Customers</Link>
        <Link href="/add" className="flex-1 text-center p-3">+ Add</Link>
      </nav>
    </main>
  );
}
