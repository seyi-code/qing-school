# KMS homepage assets

Copy files from `kms-homepage-fixed-assets.zip` → `assets/` into this folder:

- `kms-school-crest.jpg` (logo/crest)
- `hero-classroom.jpg`
- `about-students.jpg`
- `admissions-students.jpg`
- `early-years.jpg`
- `primary-school.jpg`
- `junior-secondary.jpg`
- `senior-secondary.jpg`
- `why-classroom.jpg`

Then:

```bash
git add public/kms-home
git commit -m "assets: KMS homepage crest and photos"
git push origin staging
```

Until these files are on the branch, the new layout still works; photos may show empty until the push lands.
