# Formal Prisma migrations & Decimal money

## Current state (main)

`prisma/schema.prisma` already uses **Decimal(12, 2)** for money fields:

- FeeItem.amount
- Invoice.totalAmount, amountPaid
- Payment.amount
- ExpenseRecord.amount
- Payslip.gross / deductions / net
- Staff.monthlySalary
- TransportRoute.feeAmount

Scores / CBT marks remain **Float** (not currency).

## Code rule

```ts
import { toMoney, asMoneyInput } from "@/lib/money";

const paid = toMoney(invoice.amountPaid);
const due = toMoney(invoice.totalAmount) - paid;
// never: invoice.totalAmount - invoice.amountPaid
```

## Staging vs production

| Env | DB | Command |
|-----|-----|--------|
| Staging | Neon preview / staging URL | `npx prisma db push` or `migrate deploy` |
| Production | Neon main | Only after staging green |

**Never** point a random laptop at production `DATABASE_URL` for experiments.

## Formal migrations path

1. Keep schema as source of truth.
2. When you are ready to leave `db push`:

```bash
# staging DATABASE_URL only
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_baseline/migration.sql
# review SQL, then:
npx prisma migrate resolve --applied 0_baseline
```

Or baseline with:

```bash
npx prisma migrate dev --name baseline_decimal --create-only
# edit SQL if needed, apply on staging first
```

3. Production promote:
   - Backup Neon
   - `migrate deploy` in a short window
   - Smoke fees + pay + report

## Staging checklist (Decimal)

- [ ] Login works
- [ ] Fee invoice totals display correctly
- [ ] Record payment (mock or live)
- [ ] Payroll payslip numbers
- [ ] No Prisma Decimal arithmetic TypeScript errors in build

## Related

- `docs/DECIMAL_STAGING.md`
- `docs/P0_ISOLATION_CHECKLIST.md`
- `lib/money.ts`
