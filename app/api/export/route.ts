import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { getSellerId } from '@/lib/seller';

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Seller-scoped CSV export — no lock-in, open in Excel/Sheets.
export async function GET() {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, and(eq(customers.id, orders.customerId), eq(customers.sellerId, sellerId)))
    .where(eq(orders.sellerId, sellerId))
    .orderBy(desc(orders.createdAt))
    .limit(5000);

  const head = ['date', 'customer', 'phone', 'product', 'qty', 'total_kobo', 'paid_kobo', 'payment', 'status', 'delivery', 'followup_date'];
  const lines = [head.join(',')];
  for (const { order: o, customer: c } of rows) {
    lines.push(
      [
        o.orderDate, c?.name ?? '', c?.phone ?? '', o.productName, o.qty,
        o.totalAmount, o.amountPaid, o.paymentStatus, o.orderStatus,
        o.deliveryInfo ?? '', o.followUpDate ?? ''
      ].map(csvCell).join(',')
    );
  }
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="qubators-orders.csv"'
    }
  });
}
