# P0 Multi-school isolation checklist

Gate before merging `staging` → `main` or selling to multiple schools.

## Automated

1. Log in as **Platform admin** → `/platform`
2. Click **Run isolation probe**
3. Expect: ≥2 schools, **0 orphans**, admissions samples match each school prefix

## Manual (Work as each school)

| Check | School A (e.g. KMS) | School B (e.g. TEST) |
|-------|---------------------|----------------------|
| Dashboard counts | Own only | Own only |
| Students list | Own only | Own only |
| Classes / arms | Own only | Own only |
| Fees / debtors CSV | Own admission prefixes | Own prefixes |
| Payroll / Leave | Own staff | Empty or own |
| Library / Hostel / Transport | Own | Empty or own |
| CMS pages | Own | Own / empty |
| CBT / Exams | Own | Own / empty |

## Admission format

`{SHORT}/{BRANCH}/{YEAR}/{####}` e.g. `KMS/MAT/2026/0001`, `TEST/MAIN/2026/0001`

Legacy wrong prefixes: edit on student page.

## Pass criteria (P0 green)

- [ ] Isolation probe `ok: true`
- [ ] Manual table all green for A and B
- [ ] No server 500 on CMS / Settings under either school
- [ ] Staging Decimal money + `toMoney()` only (no raw Decimal arithmetic)

## After P0 → P2 production promote

1. Backup Neon **main**
2. Apply Decimal + Branch SQL on main only if not already
3. Merge `staging` → `main`
4. Smoke login + fees on production URL
