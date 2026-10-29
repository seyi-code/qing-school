# Legal outline — NDA + IP assignment (collaborators)

**Status:** Draft outline for counsel. **Not legal advice.**  
Have a lawyer licensed in your jurisdiction (e.g. Nigeria / Uganda) turn this into a binding agreement before granting repo or production access.

**Product:** Qing School / `qing-school` multi-tenant school management software and related services.

---

## 1. Parties

- **Disclosing / Owning Party (“Company”):** [Full legal name or individual trading name], [address], [email].
- **Receiving Party (“Collaborator”):** [Full name], [address], [email], [GitHub username].

Effective date: _______________

---

## 2. Purpose

Collaborator may receive access to confidential information and source code solely to:

- [ ] Software development / code review
- [ ] Design / content
- [ ] DevOps / infrastructure
- [ ] Other: _______________

Access is limited to what Company explicitly grants (e.g. private GitHub repo, staging environment).

---

## 3. Confidential information (NDA)

Includes, without limitation:

- Source code, schemas, architecture, documentation, roadmaps
- Credentials, API keys, environment variables, infrastructure details
- School customer data, learner data, billing data, analytics
- Business plans, pricing, non-public commercial terms
- Anything marked confidential or that a reasonable person would treat as confidential

**Exclusions:** information already public through no fault of Collaborator; independently developed without use of Company materials; required by law (with notice to Company where legally allowed).

**Obligations:**

- Use confidential information only for the Purpose.
- Do not copy, share, publish, or open-source Company materials without written consent.
- Do not use confidential information to build a competing product during the term and for **[12 / 24] months** after access ends *(lawyer to confirm enforceability in your jurisdiction)*.
- Apply at least reasonable care (and no less care than for their own confidential info).

**Term of confidentiality:** while engaged + **[3 / 5] years** after access ends (trade secrets: as long as they remain secret).

---

## 4. Intellectual property assignment

- All work product created by Collaborator **for the Project** (code, designs, docs, configs, prompts, scripts) is **work made for the Company** / assigned to Company upon creation.
- Collaborator assigns all right, title, and interest in such work product to Company, including moral rights to the extent waivable under applicable law.
- Pre-existing tools or libraries Collaborator owned before the engagement remain theirs; Collaborator grants Company a **perpetual, worldwide, royalty-free license** to use any pre-existing material embedded in the Project as needed to operate and commercialize the product.
- Collaborator will sign further documents if needed to perfect Company’s title.

---

## 5. Access and systems

- GitHub role: **[Write / Triage]** (not Admin unless Company decides).
- Default environment: **staging only**. Production access only if written and time-limited.
- No sharing of accounts. 2FA required on GitHub (and Vercel if invited).
- On request or on termination: return or securely delete Company materials and confirm in writing within **7 days**.

---

## 6. Term and termination

- Engagement starts on Effective Date and continues until terminated by either party with **[7 / 14] days** notice, or immediately for material breach.
- On termination: all system access ends; Sections on confidentiality, IP, and survival continue as stated.

---

## 7. No employment / no partnership (if contractor)

- Collaborator is an independent contractor unless a separate employment contract says otherwise.
- No authority to bind Company or incur debt.

---

## 8. Equity (optional — only if applicable)

If Collaborator receives equity or options:

- Percentage / pool: _______________
- Vesting: e.g. **4 years**, **1-year cliff**, monthly thereafter
- Good leaver / bad leaver: *(counsel to draft)*
- Equity does **not** replace IP assignment of work product

---

## 9. Governing law and disputes

- Governing law: **[Country / State]**.
- Disputes: **[negotiation → mediation → courts / arbitration in City]**.

---

## 10. Signatures

**Company**  
Name: _______________  Role: _______________  
Signature: _______________  Date: _______________

**Collaborator**  
Name: _______________  
Signature: _______________  Date: _______________

---

## Owner process (before invite)

1. Fill parties and Purpose.
2. Send to lawyer for jurisdiction-specific NDA + IP (and non-compete only if enforceable).
3. Both parties sign (PDF or e-sign).
4. Store signed copy offline + cloud backup.
5. Then invite to GitHub with least privilege.
6. On exit: run `SECURITY.md` offboarding checklist same day.

## What this outline is not

- Not a substitute for a lawyer-reviewed contract.
- Not an employment agreement, shareholders’ agreement, or full founder agreement.
- Not permission to open-source the repository.
