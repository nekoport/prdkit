# Branch Protection Rules — Setup Guide

Setelah push ke GitHub, setup branch protection di:
**Settings → Branches → Add rule**

## Recommended rules for `main` branch:

### 1. Protect matching branches
- ✅ Require a pull request before merging
  - Required approvals: 1 (atau 0 kalau solo developer)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `CI / Lint + Typecheck + Build` (dari `.github/workflows/ci.yml`)
    - `Build Status (required for merge)`
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

### 2. Rules applied to everyone including administrators
- ✅ Allow force pushes: **Never**
- ✅ Allow deletions: **Never**

### 3. Workflow setup
Pastikan GitHub Actions enabled di:
**Settings → Actions → General → Allow all actions and reusable workflows**

## Workflow file location
`.github/workflows/ci.yml` — otomatis terdeteksi GitHub setelah push.

## What CI checks:
1. **Lint** — ESLint dengan next-config (fail kalau ada error)
2. **Typecheck** — `tsc --noEmit` (fail kalau ada TypeScript error)
3. **Build** — `bun run build` (fail kalau Next.js build error)
4. **Security Audit** — `bun audit` (report only, tidak fail CI)

## Local pre-commit (optional but recommended)
Untuk mencegah commit yang akan fail CI:

```bash
# Install husky + lint-staged
bun add -d husky lint-staged
bunx husky init
echo "bunx lint-staged" > .husky/pre-commit
```

Tambah ke `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"]
  }
}
```
