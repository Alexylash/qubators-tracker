# Qubators — Beta Launch Checklist

> MVP status: Slices A–D + Phase 4 quality done. Local-first: Next.js + Postgres (5433) + Better Auth + R2-optional. No cloud bills.

## 1. Recruit 10–15 sellers (Week 1)
- Where: Instagram vendors, WhatsApp vendors you already know — fashion, beauty, food first.
- Pitch (use this exact line): **"Never lose an order again. Your WhatsApp orders, organized."**
- Promise: free during beta, data export anytime (CSV), private to their account.
- Do NOT chase thousands of users. 10 active sellers beat 1,000 signups.

## 2. Onboard each seller (15 min each)
1. Create their account together on `/signup` (use their real shop email).
2. Record their FIRST real WhatsApp order together on `/add` — must take <60 seconds.
3. Show Home: "This tells you who never pay, wetin dey process, who to follow up."
4. Show follow-up: set tomorrow's date on one unpaid order.
5. Share support WhatsApp group link. Speak Pidgin + English, no enterprise grammar.

Demo account for practice (local): `demo@qubators.local / password123` — run `node scripts/seed-demo.cjs` first.

## 3. Watch these numbers weekly (`/metrics` per seller + DB)
| Gate | Target Wk1 | Query |
|---|---|---|
| Activation (first order <24h of signup) | ≥70% | `first_order` event vs user created |
| Orders / active seller / week | ≥8 | `/metrics` weekOrders |
| D7 retention (creates order in week 2) | ≥60% | order_created by week |
| New → Delivered completion | rising | `order_delivered` / total |
| Payment updates per order | ≥1 | `payment_updated` count |
| Follow-ups completed | rising | `followup_done` count |

The one question that matters: **"Are sellers recording in Qubators instead of memory/notebooks?"**

## 4. Feedback loop (30 min/week per seller)
Ask exactly:
1. "Which order this week would you have forgotten without Qubators?"
2. "What took too many taps?"
3. "Who did you follow up with because of the reminder?"
4. "What is missing before you pay for this?"

Fix the top 3 frictions before recruiting more sellers. Do not build catalog/analytics/team until 100 active sellers ask with their wallets.

## 5. Ops (local hosting)
- Daily: `pnpm dev` running, Postgres on 5433 (`pg_isready -h localhost -p 5433`).
- Weekly: `pnpm backup` → copy `backups/` to external drive. Test restore quarterly.
- Phone demo: same WiFi → `http://<laptop-ip>:3000`. Allow firewall for port 3000.
- Before each market day: `pnpm test` + `pnpm exec tsc --noEmit` green.

## 6. Do NOT build yet (post-MVP, demand-gated)
Product catalog → payment verification → delivery riders → smart SMS → analytics charts → team roles. See `Docs/Implementation Plan.md` Phase 6.
