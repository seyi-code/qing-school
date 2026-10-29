# Security policy — Qing School (qing-school)

Private multi-tenant school management SaaS. This document is for **owners and approved collaborators** only.

## Reporting a vulnerability

If you find a security issue (auth bypass, tenant data leak, secret exposure, RCE):

1. **Do not** open a public GitHub issue.
2. Email the project owner (billing / admin contact on the live platform).
3. Include: steps to reproduce, impact (which schools/data), and whether it is already exploited.

We aim to acknowledge within **72 hours** and prioritise tenant-isolation and auth issues above cosmetic bugs.

## Access rules (source code)

| Rule | Detail |
|------|--------|
| Repository | **Private** only. No public forks of the production codebase. |
| Collaborators | Invite only after signed NDA + IP assignment (see `docs/LEGAL_OUTLINE_NDA_IP.md`). |
| Role | Prefer **Write** or **Triage**. **Admin** reserved for the product owner. |
| Branch | Protect `main`: PR required; no force-push. |
| Secrets | Never commit `.env`, keys, or real `DATABASE_URL`. Use `.env.example` placeholders only. |
| Production | Collaborators use **staging** DB and test payment keys unless explicitly granted production. |

### Offboarding (same day)

When access ends, revoke in this order:

1. GitHub collaborator / deploy keys
2. Vercel team membership
3. Database user / connection string rotation if they had prod access
4. Paystack / Blob / email API keys if shared
5. Confirm local clones deleted (contract obligation)

## Secrets inventory (never in git)

- `DATABASE_URL` (production and staging separate)
- Session / auth secrets
- `PAYSTACK_SECRET_KEY` (live vs test)
- `BLOB_READ_WRITE_TOKEN` / Blob store credentials
- Email provider keys (e.g. Resend)
- Any third-party webhooks secrets

Rotate after suspected leak or collaborator exit from production access.

## Backend / application security

### Authentication & roles

- Sensitive routes require a valid session.
- Role checks: `PLATFORM_ADMIN`, school roles (`ADMIN`, `PRINCIPAL`, etc.).
- Do not trust client-supplied `schoolId` alone; resolve tenant from session / approved “work as school” context on the server.

### Multi-tenant isolation

- Queries for students, fees, CMS, notices, report templates must be scoped by `schoolId`.
- Public CMS pages use school slug / `?school=` consistently.
- Run isolation checks after schema or tenancy changes (see `docs/P0_ISOLATION_CHECKLIST.md`, `docs/MULTI_SCHOOL_PROBE.md`).

### APIs & uploads

- Validate request bodies (e.g. Zod).
- Upload endpoints: auth + role gate; size limits; no arbitrary path write.
- Payment webhooks: verify provider signature before mutating billing state.

### Deployments (Vercel)

- Prefer **Deployment Protection** on Preview so preview URLs are not anonymously public.
- Production env vars only on Production; staging on Preview/Development as appropriate.
- Disable or restrict deploy-from-fork if the platform supports it.

## Data protection

- Production database holds real school and learner data — treat as confidential.
- Do not export production dumps to personal laptops without owner approval and encryption at rest.
- Staging should use anonymised or synthetic data where possible.

## Allowed local development

1. Clone private repo after invite.
2. Copy `.env.example` → `.env.local` with **staging** credentials only.
3. Never point local dev at production DB unless the owner explicitly approves a one-off task.

## What this does *not* cover

- Legal ownership of IP (contracts).
- Physical device security of collaborators (use disk encryption + 2FA).
- Guarantees against a malicious insider with full access — minimise who has full access.

---

**Owner checklist (quarterly)**

- [ ] Repo still private; collaborator list reviewed
- [ ] `main` branch protection on
- [ ] 2FA enabled on GitHub + Vercel
- [ ] Staging ≠ production database
- [ ] No secrets in recent commits (`git log` / secret scanning)
- [ ] Paystack test vs live keys separated
