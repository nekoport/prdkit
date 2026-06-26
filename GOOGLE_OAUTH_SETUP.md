# Google OAuth Setup Guide — PRDKit

Panduan lengkap setup Google OAuth untuk login & register di PRDKit.

## Prasyarat

- Akun Google (Gmail atau Google Workspace)
- Akses ke [Google Cloud Console](https://console.cloud.google.com)
- PRDKit sudah running (local atau production)

---

## Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Klik dropdown project selector di top bar → **New Project**
3. Isi:
   - Project name: `PRDKit OAuth` (atau bebas)
   - Organization: biarkan default (No organization)
4. Klik **Create**
5. Tunggu project dibuat, lalu pilih project tersebut di dropdown

## Langkah 2: Konfigurasi OAuth Consent Screen

OAuth Consent Screen adalah halaman yang user lihat saat klik "Sign in dengan Google" — menampilkan nama app, logo, dan permission yang diminta.

1. Di sidebar kiri, buka **APIs & Services → OAuth consent screen**
2. Pilih **User Type**:
   - **External** — untuk publik (siapapun dengan Google account bisa login)
   - **Internal** — hanya untuk Google Workspace organization kamu
3. Klik **Create**
4. Isi form **OAuth consent screen** (tab pertama):
   - **App name**: `PRDKit`
   - **User support email**: email kamu
   - **App logo**: (opsional, upload logo PRDKit)
   - **Application home page**: `https://yourdomain.com` (atau `http://localhost:3000` untuk dev)
   - **Application privacy policy URL**: `https://yourdomain.com/privacy`
   - **Application terms of service URL**: `https://yourdomain.com/terms`
   - **Authorized domains**: `yourdomain.com` (atau biarkan kosong untuk dev)
   - **Developer contact information**: email kamu
5. Klik **Save and Continue**
6. Tab **Scopes**:
   - Klik **Add or Remove Scopes**
   - Pilih scope:
     - `userinfo.email` (lihat email)
     - `userinfo.profile` (lihat profil dasar: nama, foto)
     - `openid` (OpenID Connect)
   - Klik **Update** → **Save and Continue**
7. Tab **Test users**:
   - Tambahkan email kamu + email tester lain (untuk testing sebelum publish)
   - Klik **Save and Continue**
8. Review summary → **Back to Dashboard**

### Publishing (production only)

Untuk production (publik), setelah test OK:
1. OAuth consent screen → **Publish App** → **Confirm**
2. Status berubah dari "Testing" ke "In production"
3. Untuk apps dengan sensitive scopes, butuh Google verification (bisaambil berminggu-minggu). Tapi untuk PRDKit yang hanya minta email + profile basic, biasanya tidak perlu verification.

## Langkah 3: Buat OAuth 2.0 Client ID

1. Di sidebar kiri, buka **APIs & Services → Credentials**
2. Klik **+ Create Credentials** → **OAuth client ID**
3. Pilih **Application type**: `Web application`
4. Isi:
   - **Name**: `PRDKit Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (untuk dev)
     - `https://yourdomain.com` (untuk production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (untuk dev)
     - `https://yourdomain.com/api/auth/callback/google` (untuk production)
5. Klik **Create**
6. Popup muncul dengan **Client ID** dan **Client Secret** — copy keduanya

## Langkah 4: Set Environment Variables

### Untuk development (`.env` file):

```bash
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000
```

### Untuk production (Vercel):

1. Buka project kamu di Vercel
2. Settings → Environment Variables
3. Add:
   - `GOOGLE_CLIENT_ID` = (paste Client ID dari Google Cloud)
   - `GOOGLE_CLIENT_SECRET` = (paste Client Secret dari Google Cloud)
   - `NEXTAUTH_URL` = `https://yourdomain.com`
4. Save → Redeploy

## Langkah 5: Test Login Google

### Verify configuration:

```bash
# Cek apakah Google OAuth terkonfigurasi dengan benar
curl http://localhost:3000/api/auth/check-google
```

Response harus:
```json
{
  "enabled": true,
  "configured": {
    "googleClientId": true,
    "googleClientSecret": true,
    "nextauthSecret": true,
    "nextauthUrl": true
  },
  "expectedRedirectUri": "http://localhost:3000/api/auth/callback/google",
  "issues": []
}
```

Kalau `enabled: false` atau ada `issues`, fix sesuai pesan error.

### Test login flow:

1. Buka `http://localhost:3000/sign-in`
2. Tombol **"Sign in dengan Google"** harus muncul (di bawah form email/password)
3. Klik tombol tersebut
4. Di-redirect ke Google consent screen
5. Pilih Google account → consent permissions
6. Di-redirect balik ke PRDKit → masuk ke `/dashboard`

### Test register flow (user baru):

1. Sign out
2. Buka `http://localhost:3000/sign-up`
3. Klik **"Daftar dengan Google"**
4. Pilih Google account yang **belum pernah** daftar di PRDKit
5. Setelah consent → di-redirect ke `/dashboard`
6. Welcome email otomatis dikirim (kalau Resend aktif)

## Langkah 6: Verify di Admin Dashboard

Jika kamu admin (email ada di `ADMIN_EMAILS`):

1. Buka `/admin`
2. Lihat **Breakdown Auth Provider** — harus muncul "google" dengan count user
3. Lihat **Pengguna Terbaru** — user Google akan muncul dengan provider "google"

## Troubleshooting

### Issue: Tombol "Sign in dengan Google" tidak muncul

**Penyebab:** `GOOGLE_CLIENT_ID` atau `GOOGLE_CLIENT_SECRET` belum diset di env var.

**Fix:**
```bash
# Check konfigurasi
curl http://localhost:3000/api/auth/check-google

# Set env var di .env (dev) atau Vercel (production)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### Issue: Error "redirect_uri_mismatch"

**Penyebab:** Redirect URI di Google Cloud Console tidak cocok dengan yang dipakai PRDKit.

**Fix:**
1. Cek expected redirect URI:
   ```bash
   curl http://localhost:3000/api/auth/check-google | jq .expectedRedirectUri
   ```
2. Buka Google Cloud Console → Credentials → edit OAuth client
3. Authorized redirect URIs harus include persis:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`
4. Save → tunggu 5 menit (Google cache) → test lagi

### Issue: Error "access_denied" di Google consent screen

**Penyebab:** Email kamu belum di-add sebagai test user (saat OAuth consent screen masih "Testing" status).

**Fix:**
1. Google Cloud Console → OAuth consent screen → Test users
2. Add email kamu
3. Test lagi

Atau publish app ke production (lihat langkah 2 — Publishing).

### Issue: Error "invalid_client"

**Penyebab:** Client ID atau Client Secret salah/salah ketik.

**Fix:**
1. Google Cloud Console → Credentials → copy ulang Client ID + Secret
2. Update env var
3. Restart server

### Issue: Login berhasil tapi langsung di-redirect ke /sign-in (infinite loop)

**Penyebab:** User Google baru tidak ter-create di DB (bug lama, sudah di-fix di code terbaru).

**Fix:** Pastikan pakai code terbaru (cek `src/lib/auth.ts` callback `signIn` — harus ada logic create user untuk Google user baru).

### Issue: Google user tidak terima welcome email

**Penyebab:** Resend belum dikonfigurasi (`RESEND_API_KEY` + `EMAIL_FROM` belum diset).

**Fix:**
```bash
RESEND_API_KEY=re_xxx
EMAIL_FROM=PRDKit <noreply@yourdomain.com>
```

Verify domain kamu di Resend dashboard dulu.

### Issue: Google user tidak jadi admin walau email ada di ADMIN_EMAILS

**Penyebab:** Field `role` di DB tidak ter-set saat Google signup.

**Fix:** Code terbaru sudah handle ini — saat Google user baru, `role` otomatis "admin" jika email ada di `ADMIN_EMAILS`. Pastikan pakai code terbaru.

## Security Notes

- **Client Secret** adalah secret — JANGAN commit ke Git atau expose ke client
- `GOOGLE_CLIENT_SECRET` hanya dipakai di server-side (NextAuth config)
- `GOOGLE_CLIENT_ID` boleh di-expose (public), tapi di PRDKit tidak kita expose ke client
- Google OAuth menggunakan PKCE (Proof Key for Code Exchange) untuk proteksi tambahan
- Session token di-sign dengan `NEXTAUTH_SECRET` (JWT strategy)

## Production Checklist

Sebelum go-live dengan Google OAuth:

- [ ] OAuth consent screen status: "In production" (bukan "Testing")
- [ ] Authorized redirect URIs: hanya `https://yourdomain.com/api/auth/callback/google`
- [ ] Authorized JavaScript origins: hanya `https://yourdomain.com`
- [ ] Privacy Policy URL di OAuth consent screen: `https://yourdomain.com/privacy`
- [ ] Terms of Service URL di OAuth consent screen: `https://yourdomain.com/terms`
- [ ] Env var di Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`
- [ ] Test login dengan Google account baru (bukan tester)
- [ ] Verify welcome email diterima
- [ ] Verify user muncul di admin dashboard
- [ ] Verify logout works
- [ ] Test re-login (existing Google user)

## Migration: dari email/password ke Google

User yang sudah daftar pakai email/password tetap bisa login dengan cara lama. Kalau user yang sama coba login pakai Google dengan email yang sama:

1. PRDKit detect email sudah ada di DB
2. Email otomatis ter-verify (kalau belum)
3. User langsung masuk ke dashboard
4. `provider` field tetap "credentials" (tidak diubah ke "google")
5. User bisa login dengan dua cara: email/password atau Google

Tidak ada konflik. User tidak perlu re-register.

## FAQ

**Q: Bisakah user pakai Google account tapi email sudah dipakai untuk email/password login?**
A: Ya. PRDKit handle ini dengan baik — user bisa login dengan dua cara.

**Q: Apakah Google OAuth butuh credit card?**
A: Tidak. Google OAuth 2.0 free untuk semua volume.

**Q: Berapa limit Google OAuth?**
A: Google tidak publish hard limit, tapi praktis unlimited untuk app normal (jutaan user).

**Q: Apakah Google OAuth butuh verification untuk publish?**
A: Hanya kalau minta sensitive scopes (Drive, Calendar, dll). Untuk basic email + profile, tidak perlu verification.

**Q: Bisakah user hapus akun Google-nya dari PRDKit?**
A: Ya, di halaman `/account` → "Hapus akun saya". Akun di DB + semua PRD terhapus permanen. Akun Google asli tidak terpengaruh.

---

**Butuh bantuan?** Jalankan `curl http://localhost:3000/api/auth/check-google` untuk diagnose otomatis.
