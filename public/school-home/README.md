# Per-school public site images

The marketing homepage loads photos from:

```text
/school-home/{slug}/…
```

If a file is missing, the UI falls back to `/kms-home/` (shared default set).

## Folders

| Slug | Folder | Notes |
|------|--------|--------|
| `kms` | `/kms-home/` (default) | Classic navy/gold set already in repo |
| `dms` | `/school-home/dms/` | DEBTEB Montessori — warm / earthy assets |
| `test` | `/school-home/test/` | Demo tenant — modern / teal assets |
| *other* | `/school-home/{slug}/` | Create folder named after the school slug |

## Required filenames (optional — any missing file uses KMS fallback)

**Hero slider**

- `hero-classroom.jpg`
- `about-students.jpg`
- `admissions-students.jpg`

**Programmes section**

- `early-years.jpg`
- `primary-school.jpg`
- `junior-secondary.jpg`
- `senior-secondary.jpg`

**About section**

- Uses `about-students.jpg`

## How to add images for a school

1. Create `public/school-home/{slug}/` (e.g. `dms`).
2. Drop JPGs using the names above (landscape ~16:9 works best for hero).
3. Commit and deploy staging.
4. Open `/site/{slug}` — hero, about, and programmes should use the new set.

You can also upload via **Website CMS → Media library** and embed images in CMS blocks; the folder method above drives the **default marketing layout** (hero / programmes / about).

## Design presets (code)

See `lib/school-presets.ts`:

- `kms` → classic (navy / gold)
- `dms` → montessori (warm)
- `test` → modern (teal)

Colours still prefer values stored on the School row when set.
