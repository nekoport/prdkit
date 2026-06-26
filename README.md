# PRDKit — Generator PRD untuk AI Coding

SaaS gratis yang menghasilkan dokumen PRD (Product Requirements Document) terstruktur 10-section dari ide produk kamu. Output siap di-paste ke Cursor, Claude Code, atau v0 untuk diimplementasikan.

## Quick Start (Development)

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Run dev server
bun run dev
```

Buka http://localhost:3000. Daftar akun baru, langsung bikin PRD pertama.

## Production Deploy ke Vercel

### 1. Persiapan akun

Daftar akun gratis di:
- [Vercel](https://vercel.com) — hosting
- [Neon](https://neon.tech) atau [Supabase](https://supabase.com) — PostgreSQL database
- [Anthropic Console](https://console.anthropic.com) — Claude API (dapat $5 credit gratis)
- [Resend](https://resend.com) — email verifikasi (free 100/hari, opsional)
- [Upstash](https://upstash.com) — Redis untuk rate limiting (free 10K/hari, opsional tapi recommended)
- [Saweria](https://saweria.co) atau [Buy Me a Coffee](https://buymeacoffee.com) — link donasi

### 2. Setup Database (Neon)

1. Buat project baru di Neon
2. Copy connection string (format: `postgresql://user:pass@host/db?sslmode=require`)
3. Simpan untuk env var Vercel

### 3. Update Prisma Schema untuk PostgreSQL

```bash
# Ganti schema.prisma dengan schema.postgres.prisma
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Buat migration baru untuk PostgreSQL
bunx prisma migrate dev --name init_postgres --create-only

# Apply migration ke Neon
bunx prisma migrate deploy

# Generate Prisma Client
bun run db:generate
```

**Penting**: JANGAN pakai `db:push` di production — bisa hapus data. Selalu pakai `prisma migrate deploy` untuk apply migration ter-version.

### 4. Deploy ke Vercel

1. Push project ke GitHub
2. Connect repo ke Vercel
3. Set env var (liat tabel di bawah)
4. Deploy

### 5. Set Env Var di Vercel

| Var | Wajib | Deskripsi |
|-----|-------|-----------|
| `DATABASE_URL` | ✅ | Connection string Neon/Supabase |
| `NEXTAUTH_SECRET` | ✅ | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | URL production (https://yourdomain.com) |
| `ANTHROPIC_API_KEY` | ⚠️ | Claude API. Tanpa ini, fallback ke AgentRouter atau ZAI |
| `AGENTROUTER_API_KEY` | ⚠️ | GLM 5.2 via AgentRouter (OpenAI-compatible, $200 free credits). Daftar di agentrouter.org |
| `AGENTROUTER_MODEL` | Opsional | Model ID AgentRouter (default: `glm-5.2`) |
| `ZAI_API_KEY` | ⚠️ | Alternatif Anthropic. Daftar di chat.z.ai |
| `NEXT_PUBLIC_DONATION_URL` | ✅ | URL Saweria/Trakteer/BMAC untuk donasi |
| `NEXT_PUBLIC_DONATION_LABEL` | Opsional | Label tombol donasi (default: "Traktir kopi") |
| `NEXT_PUBLIC_APP_URL` | Opsional | URL app untuk link verifikasi email |
| `RESEND_API_KEY` | Opsional | Email verifikasi. Tanpa ini, auto-verify (dev mode) |
| `EMAIL_FROM` | Opsional | Email pengirim Resend (e.g. `PRDKit <noreply@yourdomain.com>`) |
| `UPSTASH_REDIS_REST_URL` | Opsional | Rate limiting production. Tanpa ini, in-memory (single-instance) |
| `UPSTASH_REDIS_REST_TOKEN` | Opsional | Token Upstash Redis |
| `CONTEXT7_API_KEY` | Opsional | Fetch dokumentasi terkini. Daftar di context7.com |
| `GOOGLE_CLIENT_ID` | Opsional | OAuth Google. Setup di console.cloud.google.com |
| `GOOGLE_CLIENT_SECRET` | Opsional | Secret OAuth Google |
| `NEXT_PUBLIC_SENTRY_DSN` | Opsional | Error tracking. Daftar di sentry.io (free 5K errors/bln) |
| `SENTRY_ORG` | Opsional | Sentry org slug (untuk upload source maps) |
| `SENTRY_PROJECT` | Opsional | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Opsional | Auth token Sentry (untuk upload source maps saat build) |

### 6. Set Google OAuth (opsional)

1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Buat OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Copy Client ID + Secret ke env var Vercel

## Batasan Free Tier

| Fitur | Limit |
|-------|-------|
| Generate PRD | 10 per user per 24 jam |
| Revisi via chat | 50 per user per 24 jam |
| Sign up per IP | 5 per jam |
| Auth attempt per IP | 30 per jam |
| Password reset request | 30 per IP per jam |
| Penyimpanan PRD | Unlimited |

Untuk ubah limit, edit `src/lib/rate-limit.ts` → `LIMITS` constant.

## Fitur

### Auth
- Sign up dengan email + password
- Sign in dengan credentials atau Google OAuth (opsional)
- Email verifikasi (Resend, opsional — auto-verify di dev)
- Reset password via email link (link berlaku 1 jam)
- Sign out

### PRD Generation
- Generate PRD dari ide dalam <90 detik
- 10-section structured output (Overview → AI Implementation Hints)
- Revisi via chat natural language (50 revisi/hari)
- Edit markdown langsung
- Copy ke clipboard
- Download .md

### Branding
- Live stats (jumlah user + PRD) di landing & dashboard
- Donation button (Saweria/Trakteer/BMAC) di dashboard, landing CTA, footer
- OG image dinamis (auto-generate saat share Twitter/LinkedIn/Facebook)
- Favicon SVG + apple-icon
- PWA-ready (manifest.webmanifest)

### Production-ready
- Rate limiting (in-memory dev, Upstash Redis production)
- Sentry error tracking (5K errors/bln free)
- Source maps upload ke Sentry untuk stack trace akurat
- ToS + Privacy Policy sesuai UU PDP Indonesia
- PostgreSQL schema (production) + SQLite (dev)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite untuk dev, PostgreSQL untuk production)
- **Auth**: NextAuth.js v4 (Credentials + Google OAuth)
- **AI**: Anthropic Claude Sonnet 4.5 (dengan Z.AI fallback)
- **Email**: Resend (opsional)
- **Rate Limiting**: in-memory Map (dev) atau Upstash Redis (production)
- **Context7**: MCP server untuk fetch dokumentasi terkini

## Struktur PRD yang Dihasilkan

Setiap PRD mengikuti struktur 10-section:

1. Overview — konteks & tujuan
2. Requirements — daftar tegas tingkat tinggi
3. Core Features — fitur MVP bernomor
4. User Flow — alur langkah-demi-langkah
5. Architecture — diagram sequence Mermaid
6. Database Schema — ERD Mermaid + tabel deskripsi
7. Design & Technical Constraints — stack & typography
8. Acceptance Criteria — format Given-When-Then
9. Out-of-Scope — boundary eksplisit
10. AI Implementation Hints — file structure & komponen

## Development

```bash
# Lint
bun run lint

# Build
bun run build

# Database operations
bun run db:push       # Push schema
bun run db:generate   # Generate Prisma Client
bun run db:migrate    # Create migration
bun run db:reset      # Reset database (HATI-HATI!)
```

## Legal

- [Syarat & Ketentuan](./src/app/terms/page.tsx) — `/terms`
- [Kebijakan Privasi](./src/app/privacy/page.tsx) — `/privacy`

Sesuai UU PDP Indonesia (UU No. 27/2022).

## License

MIT — bebas digunakan, dimodifikasi, dan didistribusikan.

## Dukung PRDKit

PRDKit 100% gratis. Dukung pengembangan via donasi:
- Set `NEXT_PUBLIC_DONATION_URL` ke link Saweria/Trakteer/BMAC kamu
- Tombol donasi akan muncul otomatis di landing, dashboard, dan footer
