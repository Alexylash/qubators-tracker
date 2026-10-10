export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { getAttentionItems, getHomeStats, getRecentOrders } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';
import { OrderPill, PaymentBadge } from '@/components/ui/StatusPill';
import LogoutButton from '@/components/ui/LogoutButton';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon ☀️';
  return 'Good evening 🌙';
}

export default async function Home() {
  const user = await requireUser();
  if (!user) redirect('/login');
  const [stats, attention, recent] = await Promise.all([
    getHomeStats(),
    getAttentionItems(5),
    getRecentOrders(5)
  ]);
  const empty = stats.newCount + stats.processingCount + stats.unpaidCount + stats.followupsDue === 0;

  return (
    <main className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold">{greeting()}, {user.name?.split(' ')[0] ?? 'seller'} ⚡</h1>
          <p className="text-sm font-semibold text-gray-600">What needs attention today?</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link href="/orders?filter=unpaid" className="bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">₦ PENDING</span>
          <b className="block text-2xl">{koboToNaira(stats.pendingKobo)}</b>
          <span className="text-xs font-bold">{stats.unpaidCount} orders</span>
        </Link>
        <Link href="/orders?filter=new" className="bg-[#00E5FF] border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">NEW</span>
          <b className="block text-2xl">{stats.newCount}</b>
        </Link>
        <Link href="/orders?filter=processing" className="bg-[#7C4DFF] text-white border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">PROCESSING</span>
          <b className="block text-2xl">{stats.processingCount}</b>
        </Link>
        <Link href="/orders?filter=followup" className="bg-[#FFD600] border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">FOLLOW-UPS DUE</span>
          <b className="block text-2xl">{stats.followupsDue}</b>
        </Link>
      </div>

      {empty ? (
        <div className="mt-4 bg-white border-2 border-ink rounded-2xl p-4 shadow-hard">
          <b>Start in 3 steps ⚡</b>
          <ol className="mt-2 text-sm font-semibold list-decimal ml-5 space-y-1">
            <li>Record a WhatsApp order with + below (30 seconds).</li>
            <li>See who has not paid on this Home screen.</li>
            <li>Follow up from Orders — customer history builds itself.</li>
          </ol>
          <p className="mt-2 text-xs font-bold text-gray-600">Your data stays private to your account. Export anytime.</p>
        </div>
      ) : (
        <>
          <h2 className="mt-5 text-sm font-extrabold uppercase">Needs attention</h2>
          <div className="mt-2">
            {attention.map(({ order, customer }) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2"
              >
                <b>{customer?.name ?? '—'} — {order.productName}</b>
                <div className="mt-1 flex gap-2 items-center flex-wrap">
                  <OrderPill status={order.orderStatus} />
                  <PaymentBadge status={order.paymentStatus} amount={koboToNaira(order.totalAmount)} />
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mt-5 text-sm font-extrabold uppercase">Recent orders</h2>
          <div className="mt-2">
            {recent.map(({ order, customer }) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border-2 border-ink rounded-2xl p-3 shadow-hard mb-2"
              >
                <b>{customer?.name ?? '—'} — {order.productName} × {order.qty}</b>
                <div className="mt-1 flex gap-2 items-center flex-wrap">
                  <OrderPill status={order.orderStatus} />
                  <PaymentBadge status={order.paymentStatus} amount={koboToNaira(order.totalAmount)} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link
        href="/metrics"
        className="block text-center mt-3 bg-white font-extrabold p-3 rounded-2xl border-2 border-ink shadow-hard"
      >
        Today's Activity →
      </Link>
      <Link
        href="/add"
        className="block text-center mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard"
      >
        + Add Order
      </Link>
      <nav className="mt-4 bg-ink text-white flex rounded-2xl overflow-hidden border-2 border-ink font-bold text-xs">
        <Link href="/" className="flex-1 text-center p-3 bg-brand">Home</Link>
        <Link href="/orders" className="flex-1 text-center p-3">Orders</Link>
        <Link href="/customers" className="flex-1 text-center p-3">Customers</Link>
        <Link href="/add" className="flex-1 text-center p-3">+ Add</Link>
      </nav>
    </main>
  );
}
