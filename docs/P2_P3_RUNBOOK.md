# P2 Production promote + P3 Commercial

## P2 — Promote staging → real production

**Only after P0 probe OK on staging (done).**

### A. Backup Neon main
1. Neon console → project → branch **main**
2. Create snapshot / export (or enable PITR)
3. Note current schema has Float or Decimal already

### B. Schema on Neon **main** (if not already Decimal)
Run in Neon SQL on **main** (same as staging):

```sql
-- Money columns (safe if already Decimal)
ALTER TABLE "FeeItem" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::DECIMAL(12,2);
ALTER TABLE "Invoice" ALTER COLUMN "totalAmount" TYPE DECIMAL(12,2) USING "totalAmount"::DECIMAL(12,2);
ALTER TABLE "Invoice" ALTER COLUMN "amountPaid" TYPE DECIMAL(12,2) USING "amountPaid"::DECIMAL(12,2);
ALTER TABLE "Payment" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::DECIMAL(12,2);
ALTER TABLE "ExpenseRecord" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::DECIMAL(12,2);
ALTER TABLE "Payslip" ALTER COLUMN "gross" TYPE DECIMAL(12,2) USING "gross"::DECIMAL(12,2);
ALTER TABLE "Payslip" ALTER COLUMN "deductions" TYPE DECIMAL(12,2) USING "deductions"::DECIMAL(12,2);
ALTER TABLE "Payslip" ALTER COLUMN "net" TYPE DECIMAL(12,2) USING "net"::DECIMAL(12,2);
ALTER TABLE "Staff" ALTER COLUMN "monthlySalary" TYPE DECIMAL(12,2) USING "monthlySalary"::DECIMAL(12,2);
ALTER TABLE "TransportRoute" ALTER COLUMN "feeAmount" TYPE DECIMAL(12,2) USING "feeAmount"::DECIMAL(12,2);
```

Branch table (if missing on main) — copy from `docs/BRANCH_ADMISSION.md`.

### C. Git merge (from a machine with git)
```bash
git clone https://github.com/seyi-qing/qing-school.git
cd qing-school
git checkout main && git pull
git merge staging -m "promote: P0 isolation + P3 email"
git push origin main
```

Or GitHub UI: Compare `staging` → `main` → Create pull request → Merge.

### D. Production Vercel project
- Project that deploys from **`main`** (not `qing-school-staging`)
- Env: `DATABASE_URL` = Neon **main** connection string
- Same secrets as staging + production Paystack/SMTP when ready

### E. Smoke live production URL
- Login
- Dashboard counts
- Students list
- Fees page

### Rollback
Vercel → previous Production deployment → Promote  
Neon → restore snapshot if schema broke

---

## P3 — Commercial layer

### 1. Password reset email
**Staging or production Vercel env:**
```
RESEND_API_KEY=re_xxxx
EMAIL_FROM="Qing School <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=https://qing-school-staging.vercel.app
```
Or classic SMTP:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Qing School <noreply@yourdomain.com>"
```
(SMTP path needs `nodemailer` dependency if used.)

Test: `/forgot-password` → check inbox + MessageLog status `SENT_resend`.

Never set `RESET_DEBUG=true` on real production.

### 2. Paystack live + suspend-on-nonpay
Already in code:
- `PAYSTACK_SECRET_KEY` → live payments + billing
- `PAYSTACK_PLAN_STARTER|PRO|ENTERPRISE`
- Webhook `/api/webhooks/paystack`
- Suspend when `subscriptionStatus` is PAST_DUE / CANCELLED / SUSPENDED or `isActive=false`

Platform → Work as school → billing form. Set school inactive to test suspend.

### 3. Playwright against staging
```bash
npx playwright install chromium
BASE_URL=https://qing-school-staging.vercel.app \
SMOKE_EMAIL=your@email \
SMOKE_PASSWORD='***' \
npx playwright test
```

Specs: `e2e/login.spec.ts`, `e2e/fees.spec.ts`
