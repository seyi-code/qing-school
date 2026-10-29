# SaaS billing — Paystack + Flutterwave

## Plans (NGN / month)

| Plan | Students | Price |
|------|----------|-------|
| STARTER | 500 | ₦20,000 |
| PRO | 2,000 | ₦60,000 |
| ENTERPRISE | 10,000 | ₦150,000 |

Source of truth in code: `lib/billing-catalog.ts` + `lib/plan-caps.ts`.

## Paystack setup

1. Dashboard → **Plans** → create monthly plans matching the amounts above.
2. Copy plan **codes** into Vercel:
   - `PAYSTACK_PLAN_STARTER`
   - `PAYSTACK_PLAN_PRO`
   - `PAYSTACK_PLAN_ENTERPRISE`
3. `PAYSTACK_SECRET_KEY` (live or test)
4. `PAYSTACK_WEBHOOK_SECRET` = same as secret key (HMAC) unless you use a dedicated secret
5. Webhook URL: `https://YOUR_DOMAIN/api/webhooks/paystack`
   - Events: `charge.success`, `subscription.*`, `invoice.*`
6. `NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN`
7. `PAYMENTS_MODE=live` when ready (mock allows unsigned webhooks in dev only)

Platform → Billing form → **Start Paystack subscription**.

## Flutterwave setup

1. `FLUTTERWAVE_SECRET_KEY`
2. Optional payment plans: `FLUTTERWAVE_PLAN_STARTER` / `_PRO` / `_ENTERPRISE` (payment_plan ids)
3. Optional `FLUTTERWAVE_WEBHOOK_HASH` — must match **verif-hash** header from Flutterwave
4. Webhook URL: `https://YOUR_DOMAIN/api/webhooks/flutterwave`
5. Platform form → provider **Flutterwave** → Start subscription

Without secret keys, both providers run in **mock**: plan/cap applied, no charge.

## Suspend on non-pay

Set `SUSPEND_ON_PAST_DUE=true` to set `isActive=false` when subscription becomes past_due / failed.
Default is soft status only (`PAST_DUE`) so you do not lock schools by accident.

## Manual path

**Set plan / cap (no charge)** still works for pilots and founding schools.
