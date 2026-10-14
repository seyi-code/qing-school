# Branch-aware admission numbers

Format: **`{SCHOOL}/{BRANCH}/{YEAR}/{####}`**

| Example | Meaning |
|---------|---------|
| `KMS/MAT/2026/0001` | Kayvlop · Matogun campus · 2026 · #1 |
| `TEST/LAG/2026/0001` | Test School · Lagos campus · 2026 · #1 |
| `TEST/MAIN/2026/0001` | Default branch if none chosen |

## Neon preview SQL (run once on qing-school-preview)

```sql
CREATE TABLE IF NOT EXISTS "Branch" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_schoolId_code_key" ON "Branch"("schoolId", "code");
CREATE INDEX IF NOT EXISTS "Branch_schoolId_idx" ON "Branch"("schoolId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Branch_schoolId_fkey'
  ) THEN
    ALTER TABLE "Branch"
      ADD CONSTRAINT "Branch_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

CREATE INDEX IF NOT EXISTS "Student_branchId_idx" ON "Student"("branchId");
```

Then create default branches (optional):

```sql
INSERT INTO "Branch" ("id", "schoolId", "code", "name", "isDefault")
SELECT md5(random()::text || clock_timestamp()::text), s."id", 'MAIN', 'Main campus', true
FROM "School" s
WHERE NOT EXISTS (SELECT 1 FROM "Branch" b WHERE b."schoolId" = s."id");
```

For KMS Matogun specifically:

```sql
INSERT INTO "Branch" ("id", "schoolId", "code", "name", "isDefault")
SELECT md5(random()::text), s."id", 'MAT', 'Matogun campus', true
FROM "School" s WHERE s."slug" = 'kms'
ON CONFLICT DO NOTHING;
```

## After SQL

Promote the staging deploy that includes `lib/admission.ts`. New admits get `SCHOOL/BRANCH/YEAR/####`.

Existing students: edit admission number on student page (e.g. `TEST/LAG/2026/0001`).
