export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { listCustomers } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await requireUser())) redirect('/login');
  const q = searchParams.q ?? '';
  const rows = await listCustomers(q);

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Customers</h1>
      <form method="GET" action="/customers" className="mt-2 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, phone"
          className="flex-1 p-3 rounded-2xl border-2 border-ink font-semibold bg-white"
        />
        <button className="bg-ink text-white font-extrabold px-4 rounded-2xl">Go</button>
      </form>

      {rows.length === 0 ? (
        <div className="mt-4 text-center p-6 border-2 border-dashed border-ink rounded-2xl bg-[#E0F7FF] font-bold">
          No customers yet. They appear when you save an order.
        </div>
      ) : (
        <div className="mt-3">
          {rows.map((r) => (
            <Link
              key={r.customer.id}
              href={`/customers/${r.customer.id}`}
              className="block bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2"
            >
              <b>{r.customer.name}</b>
              <span className="text-xs font-bold text-gray-600"> • {r.customer.phone ?? 'no phone'}</span>
              <div className="text-sm font-semibold mt-1">
                {r.totalOrders} orders • {koboToNaira(r.totalSpentKobo)} • Last {r.lastOrderDate ?? '—'}
              </div>
              {r.followupDue && (
                <span className="inline-block mt-1 text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-ink bg-[#FFD600]">
                  FOLLOW-UP DUE
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <nav className="mt-4 bg-ink text-white flex rounded-2xl overflow-hidden border-2 border-ink font-bold text-xs">
        <Link href="/" className="flex-1 text-center p-3">Home</Link>
        <Link href="/orders" className="flex-1 text-center p-3">Orders</Link>
        <Link href="/customers" className="flex-1 text-center p-3 bg-brand">Customers</Link>
        <Link href="/add" className="flex-1 text-center p-3">+ Add</Link>
      </nav>
    </main>
  );
}
