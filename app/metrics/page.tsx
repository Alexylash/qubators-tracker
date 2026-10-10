export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { getMetricsSummary } from '@/lib/queries';
import { koboToNaira } from '@/lib/format';

export default async function MetricsPage() {
  if (!(await requireUser())) redirect('/login');
  const m = await getMetricsSummary();

  const cards = [
    { label: 'ORDERS THIS WEEK', value: String(m.weekOrders), bg: 'bg-[#00E5FF]' },
    { label: 'TOTAL RECORDED', value: koboToNaira(m.recordedKobo), bg: 'bg-white' },
    { label: 'STILL PENDING', value: koboToNaira(m.pendingKobo), bg: 'bg-[#FFD600]' },
    { label: 'DELIVERED RATE', value: `${m.deliveredRate}%`, bg: 'bg-[#00E676]' }
  ];

  return (
    <main className="p-4">
      <Link href="/" className="text-sm font-extrabold underline">← Home</Link>
      <h1 className="mt-1 text-xl font-extrabold">Today's Activity ⚡</h1>
      <p className="text-sm font-semibold text-gray-600">Your business at a glance. Private to you.</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} border-2 border-ink rounded-2xl p-3 shadow-hard`}>
            <span className="text-xs font-bold">{c.label}</span>
            <b className="block text-2xl">{c.value}</b>
          </div>
        ))}
      </div>

      <div className="mt-3 bg-white border-2 border-ink rounded-2xl p-3 shadow-hard text-sm font-bold">
        {m.totalOrders} total orders
        {m.firstOrderAt ? ` • first recorded ${m.firstOrderAt.slice(0, 10)}` : ' • no orders yet'}<br />
        {m.paymentsUpdated} payment updates • {m.followupsDone} follow-ups done • {m.delivered} delivered
      </div>

      <a
        href="/api/export"
        className="block text-center mt-4 bg-ink text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard"
      >
        Export orders CSV ↓
      </a>
      <p className="mt-2 text-xs font-semibold text-gray-600">Your data, yours to keep. No lock-in.</p>
    </main>
  );
}
