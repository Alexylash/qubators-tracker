export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { getFollowups } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';
import FollowupRow from './FollowupRow';

const TITLES = { overdue: 'Overdue', today: 'Today', tomorrow: 'Tomorrow', later: 'Later' } as const;

export default async function FollowupsPage() {
  if (!(await requireUser())) redirect('/login');
  const groups = await getFollowups();
  const total = groups.overdue.length + groups.today.length + groups.tomorrow.length + groups.later.length;

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Follow-ups ({total})</h1>
      {total === 0 ? (
        <div className="mt-4 text-center p-6 border-2 border-dashed border-ink rounded-2xl bg-[#E0F7FF] font-bold">
          All caught up. No follow-ups due. ⚡
        </div>
      ) : (
        (Object.keys(TITLES) as (keyof typeof TITLES)[]).map(
          (g) =>
            groups[g].length > 0 && (
              <section key={g} className="mt-4">
                <h2 className="text-sm font-extrabold uppercase">{TITLES[g]} ({groups[g].length})</h2>
                <div className="mt-2">
                  {groups[g].map(({ order, customer }) => (
                    <FollowupRow
                      key={order.id}
                      order={{
                        id: order.id,
                        productName: order.productName,
                        totalAmount: order.totalAmount,
                        followUpDate: order.followUpDate,
                        followUpReason: order.followUpReason
                      }}
                      customerName={customer?.name ?? '—'}
                      customerPhone={customer?.phone ?? null}
                    />
                  ))}
                </div>
              </section>
            )
        )
      )}
      <p className="mt-4 text-xs font-semibold">
        Tip: amounts show {koboToNaira(0)} format. Tap WhatsApp to message, Mark done in 1 tap.
      </p>
      <nav className="mt-4 bg-ink text-white flex rounded-2xl overflow-hidden border-2 border-ink font-bold text-xs">
        <Link href="/" className="flex-1 text-center p-3">Home</Link>
        <Link href="/orders" className="flex-1 text-center p-3">Orders</Link>
        <Link href="/customers" className="flex-1 text-center p-3">Customers</Link>
        <Link href="/add" className="flex-1 text-center p-3">+ Add</Link>
      </nav>
    </main>
  );
}
