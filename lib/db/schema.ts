import { pgTable, text, integer, uuid, date, timestamp } from 'drizzle-orm/pg-core';

// Better Auth core tables are created by the library CLI/migration.
// Our business tables — every row scoped by sellerId = session.user.id

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  productName: text('product_name').notNull(),
  qty: integer('qty').default(1),
  variation: text('variation'),
  totalAmount: integer('total_amount').notNull(), // kobo
  amountPaid: integer('amount_paid').default(0),
  paymentStatus: text('payment_status').default('pending'),
  orderStatus: text('order_status').default('new'),
  deliveryInfo: text('delivery_info'),
  source: text('source').default('whatsapp'),
  proofR2Key: text('proof_r2_key'),
  orderDate: date('order_date').defaultNow(),
  followUpDate: date('follow_up_date'),
  followUpReason: text('follow_up_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

export const followUps = pgTable('follow_ups', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  orderId: uuid('order_id').references(() => orders.id),
  dueDate: date('due_date').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow()
});
