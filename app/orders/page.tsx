export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { listOrders, type OrderFilter } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';
import { OrderPill, PaymentBadge } from '@/components/ui/StatusPill';

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'followup', label: 'Follow-up' }
];

export default async function OrdersPage({
  searchParams
}: {
  searchParams: { q?: string; filter?: string; page?: string };
}) {
  const filter = (searchParams.filter ?? 'all') as OrderFilter;
  const q = searchParams.q ?? '';
  const page = Number(searchParams.page) || 1;
  if (!(await requireUser())) redirect('/login');
  const { rows, hasMore } = await listOrders({ q, filter, page });

  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (over.q ?? q) p.set('q', over.q ?? q);
    if (over.filter ?? filter) p.set('filter', over.filter ?? filter);
    if (over.page ?? String(page)) p.set('page', over.page ?? String(page));
    return `/orders?${p.toString()}`;
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Orders</h1>

      <form method="GET" action="/orders" className="mt-2 flex gap-2">
        <input type="hidden" name="filter" value={filter} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, phone, product"
          className="flex-1 p-3 rounded-2xl border-2 border-ink font-semibold bg-white"
        />
        <button className="bg-ink text-white font-extrabold px-4 rounded-2xl">Go</button>
      </form>

      <div className="mt-2 flex flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={link({ filter: f.key, page: '1' })}
            className={`text-[13px] font-bold border-2 border-ink rounded-full px-3 py-2 mr-1.5 mb-1.5 ${
              filter === f.key ? 'bg-ink text-white' : 'bg-white'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 text-center p-6 border-2 border-dashed border-ink rounded-2xl bg-[#E0F7FF] font-bold">
          No orders here. Try another filter.
        </div>
      ) : (
        <div className="mt-2">
          {rows.map(({ order, customer }) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2"
            >
              <b>{customer?.name ?? '—'} — {order.productName} × {order.qty}</b>
              <div className="text-xs font-bold text-gray-600">{customer?.phone ?? ''}</div>
              <div className="mt-1 flex gap-2 items-center flex-wrap">
                <OrderPill status={order.orderStatus} />
                <PaymentBadge status={order.paymentStatus} amount={koboToNaira(order.totalAmount)} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {page > 1 && (
          <Link href={link({ page: String(page - 1) })} className="flex-1 text-center bg-white font-extrabold p-3 rounded-2xl border-2 border-ink">
            ← Prev
          </Link>
        )}
        {hasMore && (
          <Link href={link({ page: String(page + 1) })} className="flex-1 text-center bg-white font-extrabold p-3 rounded-2xl border-2 border-ink">
            Next →
          </Link>
        )}
      </div>

      <a
        href="/api/export"
        className="block text-center mt-3 bg-white font-extrabold p-3 rounded-2xl border-2 border-ink"
      >
        Export CSV ↓
      </a>

      <nav className="mt-4 bg-ink text-white flex rounded-2xl overflow-hidden border-2 border-ink font-bold text-xs">
        <Link href="/" className="flex-1 text-center p-3">Home</Link>
        <Link href="/orders" className="flex-1 text-center p-3 bg-brand">Orders</Link>
        <Link href="/customers" className="flex-1 text-center p-3">Customers</Link>
        <Link href="/add" className="flex-1 text-center p-3">+ Add</Link>
      </nav>
    </main>
  );
}
