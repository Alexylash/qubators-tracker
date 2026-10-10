import { pgTable, text, integer, uuid, date, timestamp, boolean } from 'drizzle-orm/pg-core';

// Better Auth core tables (managed by better-auth via drizzleAdapter, provider pg).
// Names must stay: user / session / account / verification.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

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

// First-party product events (no third-party tracker, no chat content).
// order_created | first_order | payment_updated | order_delivered | followup_done
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').notNull(),
  event: text('event').notNull(),
  meta: text('meta'),
  createdAt: timestamp('created_at').defaultNow()
});

// Phase 6.1: lightweight product catalog — save once, pick in Add Order.
// Variations stored as comma text ("S,M,L,XL"). No inventory counts in MVP.
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').notNull(),
  name: text('name').notNull(),
  priceKobo: integer('price_kobo').notNull(),
  variations: text('variations'),
  active: boolean('active').default(true),
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
