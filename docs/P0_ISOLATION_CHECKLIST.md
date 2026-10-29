# P0 Multi-school isolation checklist

Gate before selling to multiple schools or promoting risky schema changes.

## Automated

1. Log in as **Platform admin** → `/platform`
2. Click **Run isolation probe**
3. Expect:
   - ≥2 schools
   - **0 orphans** on students, staff, classes, CMS pages, invoices
   - Optional warnings only for media/notices/users if still cleaning
   - Admission samples match each school shortName prefix
   - Per-school `cmsPages` / `mediaAssets` counts look sensible

## Manual (Work as each school)

| Check | School A (e.g. KMS) | School B (e.g. TEST / DMS) |
|-------|---------------------|----------------------------|
| Dashboard counts | Own only | Own only |
| Students list | Own only | Own only |
| Classes / arms | Own only | Own only |
| Fees / debtors | Own admission prefixes | Own prefixes |
| Payroll / Leave | Own staff | Empty or own |
| Library / Hostel / Transport | Own | Empty or own |
| CMS pages | Own | Own / empty |
| CMS pack / DMS template | Install on B does not change A | |
| CBT / Exams | Own | Own / empty |

## CMS template-from-DMS

On school B CMS admin:

1. **Apply DMS template** (copies DMS pages, rebrands name/slug/`?school=`)
2. Confirm `/site/{b-slug}` and `/p/home?school={b-slug}` show B branding only
3. Force overwrite only when you intend to replace B customizations

## Admission format

`{SHORT}/{BRANCH}/{YEAR}/{####}` e.g. `KMS/MAT/2026/0001`, `DMS/MAIN/2026/0001`

## Pass criteria (P0 green)

- [ ] Isolation probe `ok: true`
- [ ] Manual table green for A and B
- [ ] No server 500 on CMS / Settings under either school
- [ ] Decimal money + `toMoney()` only (`docs/MIGRATIONS_DECIMAL.md`)

## After P0 → production promote

1. Backup Neon **main**
2. Apply migrate/deploy only if schema changed
3. Smoke login + fees + one CMS page per school
