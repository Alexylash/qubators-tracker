import { and, desc, eq, ilike, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';
import { db } from './db';
import { customers, events, orders, products } from './db/schema';
import { getSellerId } from './seller';
import { nairaToKobo } from './format';

export type NewOrderInput = {
  customerName: string;
  phone?: string;
  productName: string;
  totalAmount: string | number; // naira input
  qty?: number;
  variation?: string;
  deliveryInfo?: string;
  followUpDate?: string;
  followUpReason?: string;
  notes?: string;
  source?: string;
};

export async function findOrCreateCustomer(name: string, phone?: string) {
  const sellerId = await getSellerId();
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Customer name required');

  if (phone?.trim()) {
    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.sellerId, sellerId), eq(customers.phone, phone.trim())))
      .limit(1);
    if (existing[0]) return existing[0];
  } else {
    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.sellerId, sellerId), eq(customers.name, cleanName)))
      .limit(1);
    if (existing[0] && !phone?.trim()) return existing[0];
  }

  const inserted = await db
    .insert(customers)
    .values({ sellerId, name: cleanName, phone: phone?.trim() || null })
    .returning();
  return inserted[0];
}

export async function createOrder(input: NewOrderInput) {
  const sellerId = await getSellerId();
  if (!input.customerName?.trim()) throw new Error('Customer name required');
  if (!input.productName?.trim()) throw new Error('Product required');
  const totalKobo = nairaToKobo(input.totalAmount);
  if (totalKobo <= 0) throw new Error('Total must be above ₦0');

  const customer = await findOrCreateCustomer(input.customerName, input.phone);

  const inserted = await db
    .insert(orders)
    .values({
      sellerId,
      customerId: customer.id,
      productName: input.productName.trim(),
      qty: input.qty && input.qty > 0 ? Math.floor(input.qty) : 1,
      variation: input.variation?.trim() || null,
      totalAmount: totalKobo,
      amountPaid: 0,
      paymentStatus: 'pending',
      orderStatus: 'new',
      deliveryInfo: input.deliveryInfo?.trim() || null,
      source: input.source || 'whatsapp',
      followUpDate: input.followUpDate || null,
      followUpReason: input.followUpReason?.trim() || null,
      notes: input.notes?.trim() || null
    })
    .returning();
  const order = inserted[0];
  // Activation metric: first order ever for this seller
  const prior = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.sellerId, sellerId));
  const isFirst = (prior[0]?.n ?? 1) <= 1;
  await trackEvent(sellerId, 'order_created', { totalKobo });
  if (isFirst) await trackEvent(sellerId, 'first_order', {});
  return { order, customer };
}

export async function getOrderWithCustomer(id: string) {
  const sellerId = await getSellerId();
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.sellerId, sellerId), eq(orders.id, id)))
    .limit(1);
  const order = rows[0];
  if (!order) return null;
  let customer = null;
  if (order.customerId) {
    const c = await db
      .select()
      .from(customers)
      .where(and(eq(customers.sellerId, sellerId), eq(customers.id, order.customerId)))
      .limit(1);
    customer = c[0] ?? null;
  }
  return { order, customer };
}

const ORDER_FLOW = ['new', 'confirmed', 'processing', 'delivered'] as const;
const PAYMENTS = ['pending', 'partial', 'paid', 'refunded'] as const;

export async function updateOrder(
  id: string,
  patch: Partial<{
    orderStatus: string;
    paymentStatus: string;
    amountPaid: string | number;
    amountPaidKobo: number; // direct kobo (Paystack already sends kobo)
    deliveryInfo: string;
    followUpDate: string;
    followUpReason: string;
    notes: string;
    qty: number;
    variation: string;
    proofR2Key: string;
    paystackRef: string;
  }>
) {
  const sellerId = await getSellerId();
  const values: Record<string, unknown> = {};

  // Capture pre-update state for followup_done detection
  let hadFollowup = false;
  if (patch.followUpDate === '') {
    const before = await getOrderWithCustomer(id);
    hadFollowup = !!before?.order.followUpDate;
  }

  if (patch.orderStatus !== undefined) {
    if (patch.orderStatus !== 'cancelled' && !(ORDER_FLOW as readonly string[]).includes(patch.orderStatus))
      throw new Error('Invalid order status');
    values.orderStatus = patch.orderStatus;
  }
  if (patch.paymentStatus !== undefined) {
    if (!(PAYMENTS as readonly string[]).includes(patch.paymentStatus)) throw new Error('Invalid payment status');
    values.paymentStatus = patch.paymentStatus;
  }
  if (patch.amountPaid !== undefined) values.amountPaid = nairaToKobo(patch.amountPaid);
  if (patch.amountPaidKobo !== undefined) values.amountPaid = Math.max(0, Math.round(patch.amountPaidKobo));
  if (patch.deliveryInfo !== undefined) values.deliveryInfo = patch.deliveryInfo || null;
  if (patch.followUpDate !== undefined) values.followUpDate = patch.followUpDate || null;
  if (patch.followUpReason !== undefined) values.followUpReason = patch.followUpReason || null;
  if (patch.notes !== undefined) values.notes = patch.notes || null;
  if (patch.qty !== undefined) values.qty = Math.max(1, Math.floor(patch.qty));
  if (patch.variation !== undefined) values.variation = patch.variation || null;
  if (patch.proofR2Key !== undefined) values.proofR2Key = patch.proofR2Key || null;
  if (patch.paystackRef !== undefined) values.paystackRef = patch.paystackRef || null;

  // Auto-derive partial: if amount set without explicit paymentStatus, infer it
  if ((patch.amountPaid !== undefined || patch.amountPaidKobo !== undefined) && patch.paymentStatus === undefined) {
    const current = await getOrderWithCustomer(id);
    if (current) {
      const paid = values.amountPaid as number;
      const total = current.order.totalAmount;
      values.paymentStatus = paid <= 0 ? 'pending' : paid >= total ? 'paid' : 'partial';
    }
  }

  const updated = await db
    .update(orders)
    .set(values)
    .where(and(eq(orders.sellerId, sellerId), eq(orders.id, id)))
    .returning();
  const row = updated[0] ?? null;
  if (row) {
    if (patch.amountPaid !== undefined || patch.amountPaidKobo !== undefined || patch.paymentStatus !== undefined) {
      await trackEvent(sellerId, 'payment_updated', { status: row.paymentStatus });
    }
    if (patch.orderStatus === 'delivered') await trackEvent(sellerId, 'order_delivered', {});
    if (patch.followUpDate === '' && hadFollowup) await trackEvent(sellerId, 'followup_done', {});
  }
  return row;
}

// First-party event log. Fire-and-forget safe: never throws into the request path.
export async function trackEvent(sellerId: string, event: string, meta: Record<string, unknown>) {
  try {
    await db.insert(events).values({ sellerId, event, meta: JSON.stringify(meta) });
  } catch {
    // metrics must never break order flows
  }
}

export async function getMetricsSummary() {
  const sellerId = await getSellerId();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [o, e, f] = await Promise.all([
    db
      .select({
        n: sql<number>`count(*)::int`,
        week: sql<number>`count(*) filter (where ${orders.createdAt} >= ${weekAgo}::timestamptz)::int`,
        done: sql<number>`count(*) filter (where ${orders.orderStatus} = 'delivered')::int`,
        recorded: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
        pending: sql<number>`coalesce(sum(${orders.totalAmount} - ${orders.amountPaid}) filter (where ${orders.paymentStatus} in ('pending','partial')), 0)::int`
      })
      .from(orders)
      .where(eq(orders.sellerId, sellerId)),
    db
      .select({ event: events.event, n: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.sellerId, sellerId))
      .groupBy(events.event),
    db
      .select({ at: sql<string | null>`min(${events.createdAt})::text` })
      .from(events)
      .where(and(eq(events.sellerId, sellerId), eq(events.event, 'first_order')))
  ]);
  const agg = o[0] ?? { n: 0, week: 0, done: 0, recorded: 0, pending: 0 };
  const byEvent: Record<string, number> = {};
  for (const r of e) byEvent[r.event] = r.n;
  return {
    totalOrders: agg.n,
    weekOrders: agg.week,
    deliveredRate: agg.n ? Math.round((agg.done / agg.n) * 100) : 0,
    recordedKobo: agg.recorded,
    pendingKobo: agg.pending,
    firstOrderAt: f[0]?.at ?? null,
    paymentsUpdated: byEvent['payment_updated'] ?? 0,
    followupsDone: byEvent['followup_done'] ?? 0,
    delivered: byEvent['order_delivered'] ?? 0
  };
}

// ---------- Slice B: Home + Orders List ----------

export type OrderFilter =
  | 'all'
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'delivered'
  | 'cancelled'
  | 'unpaid'
  | 'followup';

export function filterWhere(filter: OrderFilter, sellerId: string) {
  const base = eq(orders.sellerId, sellerId);
  switch (filter) {
    case 'new':
    case 'confirmed':
    case 'processing':
    case 'delivered':
    case 'cancelled':
      return and(base, eq(orders.orderStatus, filter));
    case 'unpaid':
      return and(base, inArray(orders.paymentStatus, ['pending', 'partial']));
    case 'followup':
      return and(base, isNotNull(orders.followUpDate));
    default:
      return base;
  }
}

export async function getHomeStats() {
  const sellerId = await getSellerId();
  const rows = await db
    .select({
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      n: sql<number>`count(*)::int`,
      pendingKobo: sql<number>`coalesce(sum(${orders.totalAmount} - ${orders.amountPaid}) filter (where ${orders.paymentStatus} in ('pending','partial')), 0)::int`
    })
    .from(orders)
    .where(eq(orders.sellerId, sellerId))
    .groupBy(orders.orderStatus, orders.paymentStatus);

  let newCount = 0;
  let processingCount = 0;
  let unpaidCount = 0;
  let pendingKobo = 0;
  for (const r of rows) {
    if (r.orderStatus === 'new') newCount += r.n;
    if (r.orderStatus === 'processing') processingCount += r.n;
    if (r.paymentStatus === 'pending' || r.paymentStatus === 'partial') unpaidCount += r.n;
    pendingKobo = Math.max(pendingKobo, r.pendingKobo);
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.sellerId, sellerId),
        isNotNull(orders.followUpDate),
        lte(orders.followUpDate, today)
      )
    );
  return { newCount, processingCount, unpaidCount, pendingKobo, followupsDue: due[0]?.n ?? 0 };
}

export async function getRecentOrders(limit = 5) {
  const sellerId = await getSellerId();
  return db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, and(eq(customers.id, orders.customerId), eq(customers.sellerId, sellerId)))
    .where(eq(orders.sellerId, sellerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getAttentionItems(limit = 5) {
  const sellerId = await getSellerId();
  const today = new Date().toISOString().slice(0, 10);
  // Overdue follow-ups first, then unpaid, then newest — one query, priority sort
  return db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, and(eq(customers.id, orders.customerId), eq(customers.sellerId, sellerId)))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        or(
          and(isNotNull(orders.followUpDate), lte(orders.followUpDate, today)),
          inArray(orders.paymentStatus, ['pending', 'partial']),
          eq(orders.orderStatus, 'new')
        )
      )
    )
    .orderBy(
      sql`case when ${orders.followUpDate} is not null and ${orders.followUpDate} <= ${today} then 0 when ${orders.paymentStatus} in ('pending','partial') then 1 else 2 end`,
      desc(orders.createdAt)
    )
    .limit(limit);
}

export async function listOrders(opts: { q?: string; filter?: OrderFilter; page?: number; pageSize?: number }) {
  const sellerId = await getSellerId();
  const filter: OrderFilter = opts.filter ?? 'all';
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const q = opts.q?.trim();

  const conds = [filterWhere(filter, sellerId)];
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        ilike(orders.productName, like),
        ilike(customers.name, like),
        ilike(customers.phone, like)
      )!
    );
  }

  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, and(eq(customers.id, orders.customerId), eq(customers.sellerId, sellerId)))
    .where(and(...conds))
    .orderBy(desc(orders.createdAt))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize);

  const hasMore = rows.length > pageSize;
  return { rows: rows.slice(0, pageSize), page, hasMore };
}

// ---------- Slice C: Customers + Follow-ups ----------

export type CustomerRow = {
  customer: typeof customers.$inferSelect;
  totalOrders: number;
  completedOrders: number;
  totalSpentKobo: number;
  lastOrderDate: string | null;
  followupDue: boolean;
};

export async function listCustomers(q?: string): Promise<CustomerRow[]> {
  const sellerId = await getSellerId();
  const today = new Date().toISOString().slice(0, 10);
  const like = q?.trim() ? `%${q.trim()}%` : null;

  const all = await db
    .select()
    .from(customers)
    .where(
      like
        ? and(
            eq(customers.sellerId, sellerId),
            or(ilike(customers.name, like), ilike(customers.phone, like))!
          )
        : eq(customers.sellerId, sellerId)
    )
    .orderBy(desc(customers.createdAt))
    .limit(100);

  const out: CustomerRow[] = [];
  for (const c of all) {
    const agg = await db
      .select({
        n: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where ${orders.orderStatus} = 'delivered')::int`,
        spent: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
        lastDate: sql<string | null>`max(${orders.orderDate})`,
        due: sql<number>`count(*) filter (where ${orders.followUpDate} is not null and ${orders.followUpDate} <= ${today})::int`
      })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.customerId, c.id)));
    const a = agg[0];
    out.push({
      customer: c,
      totalOrders: a?.n ?? 0,
      completedOrders: a?.done ?? 0,
      totalSpentKobo: a?.spent ?? 0,
      lastOrderDate: a?.lastDate ?? null,
      followupDue: (a?.due ?? 0) > 0
    });
  }
  // Recent activity first: customers with latest order date on top
  out.sort((x, y) => (y.lastOrderDate ?? '').localeCompare(x.lastOrderDate ?? ''));
  return out;
}

export async function getCustomerDetail(id: string) {
  const sellerId = await getSellerId();
  const c = await db
    .select()
    .from(customers)
    .where(and(eq(customers.sellerId, sellerId), eq(customers.id, id)))
    .limit(1);
  const customer = c[0];
  if (!customer) return null;

  const ords = await db
    .select()
    .from(orders)
    .where(and(eq(orders.sellerId, sellerId), eq(orders.customerId, id)))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const current = ords.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled');
  const past = ords.filter((o) => o.orderStatus === 'delivered' || o.orderStatus === 'cancelled');
  const followups = ords.filter((o) => o.followUpDate);
  const totalSpent = ords.reduce((s, o) => s + o.totalAmount, 0);
  return {
    customer,
    stats: {
      total: ords.length,
      completed: past.filter((o) => o.orderStatus === 'delivered').length,
      current: current.length,
      totalSpent
    },
    current,
    past,
    followups
  };
}

export type FollowupGroup = 'overdue' | 'today' | 'tomorrow' | 'later';

export async function getFollowups() {
  const sellerId = await getSellerId();
  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, and(eq(customers.id, orders.customerId), eq(customers.sellerId, sellerId)))
    .where(and(eq(orders.sellerId, sellerId), isNotNull(orders.followUpDate)))
    .orderBy(orders.followUpDate);

  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const today = toDate(now);
  const tomorrow = toDate(new Date(now.getTime() + 86400000));
  const groups: Record<FollowupGroup, typeof rows> = { overdue: [], today: [], tomorrow: [], later: [] };
  const dayOf = (v: unknown): string | null => {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  };
  for (const r of rows) {
    const d = dayOf(r.order.followUpDate);
    if (!d) continue;
    if (d < today) groups.overdue.push(r);
    else if (d === today) groups.today.push(r);
    else if (d === tomorrow) groups.tomorrow.push(r);
    else groups.later.push(r);
  }
  return groups;
}

// ---------- Phase 6.1: Product catalog ----------

export type ProductInput = { name: string; price: string | number; variations?: string };

export function splitVariations(v: string | null | undefined): string[] {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listProducts(q?: string) {
  const sellerId = await getSellerId();
  const like = q?.trim() ? `%${q.trim()}%` : null;
  return db
    .select()
    .from(products)
    .where(
      like
        ? and(eq(products.sellerId, sellerId), eq(products.active, true), ilike(products.name, like))
        : and(eq(products.sellerId, sellerId), eq(products.active, true))
    )
    .orderBy(products.name)
    .limit(200);
}

export async function createProduct(input: ProductInput) {
  const sellerId = await getSellerId();
  const name = input.name.trim();
  if (!name) throw new Error('Product name required');
  const priceKobo = nairaToKobo(input.price);
  if (priceKobo <= 0) throw new Error('Price must be above ₦0');
  const inserted = await db
    .insert(products)
    .values({ sellerId, name, priceKobo, variations: input.variations?.trim() || null })
    .returning();
  return inserted[0];
}

export async function updateProduct(
  id: string,
  patch: Partial<{ name: string; price: string | number; variations: string; active: boolean }>
) {
  const sellerId = await getSellerId();
  const values: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    if (!patch.name.trim()) throw new Error('Product name required');
    values.name = patch.name.trim();
  }
  if (patch.price !== undefined) {
    const kobo = nairaToKobo(patch.price);
    if (kobo <= 0) throw new Error('Price must be above ₦0');
    values.priceKobo = kobo;
  }
  if (patch.variations !== undefined) values.variations = patch.variations.trim() || null;
  if (patch.active !== undefined) values.active = patch.active;
  const updated = await db
    .update(products)
    .set(values)
    .where(and(eq(products.sellerId, sellerId), eq(products.id, id)))
    .returning();
  return updated[0] ?? null;
}
