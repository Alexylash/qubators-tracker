const ORDER_STYLES: Record<string, string> = {
  new: 'bg-[#00E5FF] text-[#00363D]',
  confirmed: 'bg-[#FFD600] text-[#3A2E00]',
  processing: 'bg-[#7C4DFF] text-white',
  delivered: 'bg-[#00E676] text-[#003318]',
  cancelled: 'bg-[#ECEFF1] text-[#37474F]'
};

const PAYMENT_DOT: Record<string, string> = {
  pending: 'bg-[#FF2D55]',
  partial: 'bg-[#FFAB00]',
  paid: 'bg-[#00C853]',
  refunded: 'bg-[#9CA3AF]'
};

export function OrderPill({ status }: { status: string | null }) {
  const s = status ?? 'new';
  const cls = ORDER_STYLES[s] ?? ORDER_STYLES.new;
  return (
    <span
      className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border-2 border-ink ${cls}`}
    >
      {s.toUpperCase()}
    </span>
  );
}

export function PaymentBadge({ status, amount }: { status: string | null; amount: string }) {
  const s = status ?? 'pending';
  const dot = PAYMENT_DOT[s] ?? PAYMENT_DOT.pending;
  return (
    <span className="text-sm font-bold">
      <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-ink mr-1.5 ${dot}`} />
      {s} • {amount}
    </span>
  );
}
