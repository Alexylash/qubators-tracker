export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { getCustomerDetail } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';
import { waLink as buildWaLink } from '@/lib/whatsapp';
import { OrderPill, PaymentBadge } from '@/components/ui/StatusPill';

export default async function CustomerDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  if (!(await requireUser())) redirect('/login');
  const data = await getCustomerDetail(params.id);
  if (!data) notFound();
  const { customer, stats, current, past, followups } = data;
  const tab = searchParams.tab ?? 'current';
  const waLink = buildWaLink(customer.phone, `Hello ${customer.name}!`);

  const shown = tab === 'past' ? past : tab === 'followups' ? followups : current;

  return (
    <main className="p-4">
      <Link href="/customers" className="text-sm font-extrabold underline">← Customers</Link>
      <h1 className="mt-1 text-xl font-extrabold">{customer.name}</h1>
      <p className="text-sm font-semibold">{customer.phone ?? 'no phone'}</p>
      {waLink && (
        <a href={waLink} target="_blank" className="inline-block mt-2 bg-[#1FDB63] font-extrabold px-4 py-2 rounded-2xl border-2 border-ink">
          WhatsApp →
        </a>
      )}

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard text-sm font-bold">
        {stats.total} orders • {stats.completed} completed • {stats.current} current • {koboToNaira(stats.totalSpent)}
      </div>

      <div className="mt-3 flex gap-1.5">
        {(['current', 'past', 'followups'] as const).map((t) => (
          <Link
            key={t}
            href={`/customers/${customer.id}?tab=${t}`}
            className={`text-xs font-extrabold px-3 py-2 rounded-full border-2 border-ink ${
              tab === t ? 'bg-ink text-white' : 'bg-white'
            }`}
          >
            {t.toUpperCase()}
          </Link>
        ))}
      </div>

      <div className="mt-2">
        {shown.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed border-ink rounded-2xl bg-[#E0F7FF] font-bold">
            Nothing here yet.
          </div>
        ) : (
          shown.map((o: any) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="block bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2">
              <b>{o.productName} × {o.qty}</b>
              <div className="mt-1 flex gap-2 items-center flex-wrap">
                <OrderPill status={o.orderStatus} />
                <PaymentBadge status={o.paymentStatus} amount={koboToNaira(o.totalAmount)} />
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        href={`/add?customer=${encodeURIComponent(customer.name)}`}
        className="block text-center mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard"
      >
        + New order for {customer.name}
      </Link>
    </main>
  );
}
