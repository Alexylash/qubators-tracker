# Qubators — Implementation Plan (Phased)

> Source: `Docs/Qubators Order and Customer Tracker.md` (PRD) + `Docs/Design Blueprint.md`
> Repo: https://github.com/Alexylash/qubators-tracker | Branch: `main`
> Current state: Docs only, no code. This plan takes you from zero → MVP launch.
> Principle: Smallest thing that prevents a lost order, built for low-end Android + poor network.

---

## 0. Executive Summary + Architectural Decision

### What we're building
Mobile-first PWA for Nigerian WhatsApp/Instagram sellers to Record → Track → Get Paid → Deliver → Follow Up. 9 screens, 4-tab nav, <30s order capture.

### Stack decision (local-first, no subscriptions — per your constraints)

**Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + PWA**
- Same routing/PWA benefits, but runs on your device: `pnpm dev` → `http://localhost:3000`. No Vercel.
- Test on phone via same WiFi: `http://192.168.x.x:3000` (we'll show your IP at setup).

**Database: Local Postgres 16 on your device + Drizzle ORM**
- What to install on Windows 10 Pro (you have none yet):
  1. Node.js LTS (includes npm) → then enable `pnpm`
  2. Postgres 16 via EDB installer (includes pgAdmin 4 for visual DB browser) — easiest, no Docker/WSL needed
  3. Optional later: Docker Desktop + `postgres:16-alpine` if you want disposable DBs
- Why Drizzle over Prisma for this: lighter, SQL-like, pairs natively with Better Auth tables, fast migrations via `drizzle-kit`. Prisma also fine if you prefer its Studio UI.
- Connection: `DATABASE_URL=postgres://postgres:<password>@localhost:5432/qubators` in `.env.local`. Data stays on your laptop.

**Auth: Better Auth (self-hosted, no per-user fees)**
- Library `better-auth` with Drizzle adapter + email/password for MVP. Sessions in Postgres (`session` table), no external service.
- Add phone OTP / social later via Better Auth plugins. Rate-limit + lockout in Next.js middleware.
- Each row carries `sellerId` (logged-in user id). Every query adds `where sellerId = session.user.id` — app-level isolation replacing Supabase RLS.

**Storage: Cloudflare R2 (S3-compatible, generous free tier) for payment proofs / avatars**
- Create 1 bucket `qubators-mvp`, get `R2_ACCOUNT_ID + ACCESS_KEY + SECRET + PUBLIC_URL`. Use AWS SDK `@aws-sdk/client-s3` pointed at `https://<account>.r2.cloudflarestorage.com`.
- MVP only stores payment-proof images. DB stores only the R2 key/URL, never blobs.
- Local dev fallback: `public/uploads/` folder if R2 keys missing, so you can work offline.

**Hosting: Local device only for now**
- Dev: `pnpm dev`. Prod-like: `pnpm build; pnpm start` → same laptop serves port 3000.
- No Vercel, no Supabase Cloud. Backups = `pg_dump` cron + copy `uploads/` to external drive. We add deploy (Coolify/VPS) in Phase 6 only when ready.

**Offline stance for MVP: Optimistic + queue, not full offline-first**
- PWA shell + form drafts in localStorage + retry on failed mutation with toast. R2 uploads retry with presigned URL.

Total monthly cost at MVP: ₦0 + optional R2 free tier (10GB storage, no egress fees like S3).

---

## Phase 1: Design System (Week 1) — Design before code

Goal: Figma components match code 1:1, no redesign mid-build.

### 1.1 Tokens — BRIGHT v2 (high-contrast, sunlight-legible)
- Colors (all bright, black-text for contrast):
  - Base: App background #F5F3FF (soft lavender mist, befitting purple brand), Card #FFFFFF with 2px #0A0A0A border for punch, Text #0A0A0A, Muted #4B5563, Border #0A0A0A
  - Brand: Primary #5B00FF (electric purple, white text), Accent #00C2FF (cyan pop for highlights), Hot #FF4D00 (CTA glow for + Add)
  - Status Order (vivid): New bg #00E5FF text #00363D, Confirmed bg #FFD600 text #3A2E00, Processing bg #7C4DFF text #FFFFFF, Delivered bg #00E676 text #003318, Cancelled bg #ECEFF1 text #37474F
  - Payment dot (neon): Pending #FF2D55, Partial #FFAB00, Paid #00C853, Refunded #9CA3AF
  - Action: Primary button #5B00FF white text + 2px black shadow (neo-brutalist pop), WhatsApp #1FDB63 black text (brighter than stock)
- Typography: 1 family (Inter). Title 20/extrabold, Body 16/semibold for numbers, Caption 13/bold uppercase for labels. Min touch target 48px (bigger for market use).
- Spacing: 4pt grid. Radius 16 for cards, 999 for pills. Hard shadow 3px 3px 0 #0A0A0A (sharp, no blur) + 2px borders.
- Rule: No gradients — solid colors only. No linear/radial gradients in Figma, CSS, or Tailwind.
- Naira formatting util: `₦45,000` with `Intl.NumberFormat('en-NG')`. Dates: Today/Tomorrow/Yesterday helper.

### 1.2 Components (14 only — from Blueprint)
Build in Figma as variants, then as React components in `components/ui/`:
BottomNav, ActionCard, OrderCard, CustomerCard, FollowUpRow, StatusPillOrder (5), StatusPillPayment (4), FilterChip, SearchBar, PrimaryButton, WhatsAppButton, TextInput, AmountInput, DatePicker, EmptyState, Toast.

Each component spec must include: default / pressed / disabled / empty / error states. No component ships without empty state.

### 1.3 Prototype test exit criteria
- Can record Ada's 2 handbags order in <30s on 360px frame while “chatting”?
- Home answers “What needs attention?” in <5s glance test with 5 users?
If no → fix Figma, not code.

Deliverable: Figma link + `design/tokens.json` exported for Tailwind config.

---

## Phase 2: Architecture + Repo Setup (Week 1-2)

### 2.1 Monorepo structure (single Next.js app, local-first)
```
app/
  (auth)/login/page.tsx
  (app)/home/page.tsx
  (app)/orders/page.tsx
  (app)/orders/[id]/page.tsx
  (app)/customers/page.tsx
  (app)/customers/[id]/page.tsx
  (app)/followups/page.tsx
  (app)/add/page.tsx
  api/auth/[...all]/route.ts (Better Auth handler)
  api/upload/route.ts (R2 presigned URL)
components/ui/ (design system)
lib/
  db/schema.ts (drizzle tables: user, session, customers, orders, follow_ups)
  db/index.ts (postgres.js pool to localhost)
  auth.ts (better-auth + drizzleAdapter)
  auth-client.ts
  r2.ts (S3 client → R2 endpoint)
  format.ts (naira, dates)
  queries.ts (seller-scoped queries)
drizzle/ (migrations, local Postgres)
public/manifest.json + icons/ + uploads/ (local fallback)
e2e/ + __tests__/
docker-compose.yml (optional: postgres:16-alpine for later)
```

### 2.2 Data model (Local Postgres 16 + Drizzle, Better Auth tables + app logic)
```sql
-- Better Auth creates: user, session, account, verification (managed by library)
-- Our tables (drizzle schema.ts), all scoped by sellerId = session.user.id:
customers (
  id uuid pk default gen_random_uuid(),
  seller_id text not null refs "user"(id) on delete cascade,
  name text not null, phone text,
  notes text, created_at timestamptz default now()
);
orders (
  id uuid pk default gen_random_uuid(),
  seller_id text not null refs "user"(id) on delete cascade,
  customer_id uuid refs customers(id) on delete set null,
  product_name text not null, qty int default 1, variation text,
  total_amount int not null, -- kobo to avoid float
  amount_paid int default 0,
  payment_status text default 'pending' check in ('pending','partial','paid','refunded'),
  order_status text default 'new' check in ('new','confirmed','processing','delivered','cancelled'),
  delivery_info text, source text default 'whatsapp',
  proof_r2_key text, -- Cloudflare R2 object key for payment proof photo
  order_date date default current_date,
  follow_up_date date, follow_up_reason text,
  notes text, created_at timestamptz default now()
);
follow_ups (
  id uuid pk default gen_random_uuid(),
  seller_id text not null refs "user"(id),
  customer_id uuid refs customers(id), order_id uuid refs orders(id),
  due_date date not null, reason text not null,
  status text default 'open', created_at timestamptz default now()
);
-- Indexes: (seller_id, order_status), (seller_id, payment_status), (seller_id, follow_up_date), customers(seller_id, phone)
-- Isolation: NO RLS (self-hosted PG). Enforce in every query: where(eq(orders.sellerId, session.user.id)). Add drizzle helper `sellerScope()`. Add test that leaks fail.
```

Derived fields (do NOT store): balance = total - paid, customer.total_spent = sum(orders), counts via views. Prevents drift.

### 2.3 API strategy (Next.js Route Handlers, no BaaS)
- Server Actions / Route Handlers query local Postgres via Drizzle with `session` check first. No Supabase client.
- React Query caches lists. Mutations optimistic.
- `/api/upload` returns R2 presigned PUT URL (or local `/public/uploads` path if `R2_*` env missing). Client uploads directly, then saves `proof_r2_key` on order.
- Later (paid): Termii OTP, Paystack verify, delivery webhooks as new `/api/*` routes — no rewrite needed.

### 2.4 PWA + performance budgets
- `next-pwa`, manifest, icons 192/512, themeColor, offline fallback page.
- Budgets: First load <3s on 3G, JS <180kb per route, images AVIF, no modals heavier than bottom sheet.
- Forms: Add Order is uncontrolled + `localStorage` draft autosave every keystroke. On submit: optimistic insert → toast “Order saved” → navigate to detail. On failure: keep draft + retry button.

### 2.5 Env + local run (no cloud)
`.env.local`: `DATABASE_URL=postgres://postgres:<pw>@localhost:5432/qubators`, `BETTER_AUTH_SECRET=...`, `BETTER_AUTH_URL=http://localhost:3000`, `R2_ACCOUNT_ID=`, `R2_ACCESS_KEY_ID=`, `R2_SECRET_ACCESS_KEY=`, `R2_BUCKET=qubators-mvp`, `R2_PUBLIC_URL=`.
Run: `pnpm dev` → `http://localhost:3000`. Prod-like: `pnpm build; pnpm start`. Phone test: allow firewall for 3000, open `http://<your-laptop-ip>:3000` on same WiFi.
GitHub Actions: `lint + typecheck + test + build` on PR only (no deploy). Backup: `pg_dump qubators > backup.sql` + zip `public/uploads/`.

Exit: `pnpm dev` runs, `drizzle-kit push` applies to localhost Postgres, Better Auth login → empty Home renders on phone via LAN IP.

---

## Phase 3: MVP Build in Slices (Weeks 3-6) — Thin vertical slices, not layers

Build in this order. Each slice is usable end-to-end.

**Slice A — Capture (P0, Week 3): Add Order + Order Detail**
- Add Order: 3 required fields, collapsed optionals, autocomplete customer name, auto-create customer by phone match.
- Order Detail Who/What/How much/Where/What’s next + inline edit + status stepper + payment selector.
- Acceptance: 3-field save <30s, works on Tecno Spark with 2GB RAM, draft survives refresh.

**Slice B — Attention (P0, Week 4): Home + Orders List**
- Home: 4 action cards with counts (single Postgres `count group by` queries), Needs-attention top 5 (overdue follow-ups > unpaid > new), Recent 5.
- Orders List: search (ILIKE name/phone/product trigram), filter chips map to `where` clauses, newest first, pagination 20.
- Acceptance: Home glance <5s, search <500ms for 1000 orders.

**Slice C — Retention (P0, Week 5): Follow-ups + Customers**
- Follow-ups List grouped Overdue/Today/Tomorrow/Later, Mark done (optimistic), WhatsApp deep link.
- Customers List + Detail with stats view, tabs Current/Past/Follow-ups, [+ New order for X] pre-fills Add.
- Acceptance: Mark done <1 tap, WhatsApp opens with prefilled “Hello {name},…”, customer totals correct.

**Slice D — Auth + Polish (P1, Week 6): Onboarding, empty states, toasts, settings**
- Login/signup, onboarding 3 slides, empty states everywhere, error toasts in plain English, delete/cancel with confirm.
- Acceptance: New seller first order <60s unaided (test with 3 sellers).

Out of scope enforced: catalog (autocomplete only), analytics charts, team roles, inventory, invoice PDF.

---

## Phase 4: Quality — Testing, Security, Data (Week 7)

- **Testing pyramid:** Vitest unit (naira format, balance calc, status transitions), Playwright e2e (record → pay → deliver → follow-up done), manual device matrix (Chrome Android Go, Opera Mini fallback message).
- **Security:** seller-scope tests (seller A cannot read seller B via leaked uuid — query must include sellerId), Better Auth session expiry + rate-limit login, R2 keys server-only, phone numbers masked in logs.
- **Data:** Weekly `pg_dump` + copy `public/uploads/` to external drive, `pg_cron` (local pg_cron or Node cron) to flag orders stuck >7 days for “Needs attention” boost.
- **Accessibility:** 44px targets, contrast AA, font scaling to 200% without horizontal scroll, Yoruba/Pidgin copy review (e.g. “Who never pay?” toggle later).

Exit: 0 critical bugs, e2e green, Lighthouse PWA >90, performance >85 on Moto G4 emulation.

---

## Phase 5: Launch + Measure (Week 8)

- **Beta:** 10-15 sellers from Instagram/WhatsApp vendors (fashion, beauty, food). Onboard via 2-min Loom in Pidgin + English. WhatsApp support group.
- **Instrumentation (privacy-light):** PostHog self-host or Plausible: activation (% first order <24h), orders/seller/week, retention D7/D30, % orders New→Delivered, % payment updates, follow-ups completed. No chat content tracking.
- **Success gate from PRD:** Are sellers recording in Qubators instead of memory/notebooks? Target: 60% D7 retention, avg 8 orders/seller in week 1.
- **Feedback loop:** Weekly 20-min calls, shadow a seller taking WhatsApp orders, fix top 3 frictions before scaling.

---

## Phase 6: Post-MVP Roadmap (prioritized by demand)

1. Product catalog (save T-shirt ₦15k S/M/L/XL, pick in Add Order)
2. Payment proof (photo upload + Paystack/Transfer verify + Partial balance tracker)
3. Delivery (rider assign, Lagos zones like Ikeja, status)
4. Smart reminders — DECIDED: free for beta (tap-to-send WhatsApp links already built, ₦0). Paid SMS (Arkesel/BulkSMSNigeria ~₦6/msg, sender-ID wait 1–4 wks) and push/VAPID only if beta sellers ask. Adapter plan: `lib/notify.ts` + per-vendor adapter.
5. Segmentation + simple sales report (repeat, high-value, inactive, pending ₦ sum)
6. Instagram/WhatsApp capture assist (share-to-Qubators, not auto-scrape for privacy)
7. Team access (staff roles) → paid tier per PRD freemium: free basic, paid for catalog + analytics + team.

Pricing validation after 100 active sellers, not before.

---

## Risks + Mitigations (Nigeria-specific)

- Poor network → PWA shell + drafts + retry, SMS fallback for reminders.
- Low-end devices → Tailwind purge, no heavy charts, virtualized lists >200 orders.
- Trust with money data → seller-scoped queries + explicit “Only you see this on this device” copy + export CSV anytime (no lock-in).
- Sellers revert to notebooks → <30s capture is non-negotiable; every extra required field needs your approval.
- OneDrive + Git on Windows → keep repo in project folder only, commit `Docs/` + `app/` separately, ignore `~$*`, `Thumbs.db`.

---

## Immediate Next Actions (for you)

1. Install: Node.js LTS → `corepack enable pnpm`, Postgres 16 (EDB + pgAdmin), then tell me — I verify with `node -v + psql --version`.
2. Create Figma file from Blueprint §7 (14 components) — I can generate Tailwind tokens next.
3. I scaffold `app/` + Drizzle schema + Better Auth + R2 upload route + local `docker-compose.yml` (optional) on a `feat/scaffold` branch for your review.

*End of Implementation Plan — ready to scaffold on approval.*
