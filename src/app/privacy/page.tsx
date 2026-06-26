import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Kebijakan Privasi — PRDKit",
  description:
    "Kebijakan privasi PRDKit — bagaimana kami mengumpulkan, menggunakan, dan melindungi data pengguna.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Terakhir diperbarui: 25 Juni 2026
          </p>

          <div className="prose-prd mt-10">
            <h2>1. Pendahuluan</h2>
            <p>
              PRDKit ("kami") berkomitmen melindungi privasi data Pengguna
              ("kamu") sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang
              Pelindungan Data Pribadi (UU PDP) Indonesia. Kebijakan ini
              menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan
              melindungi data pribadi kamu.
            </p>

            <h2>2. Data yang Kami Kumpulkan</h2>

            <h3>2.1 Data yang Kamu Berikan Saat Mendaftar</h3>
            <ul>
              <li>
                <strong>Email</strong> — digunakan sebagai identifier akun dan
                komunikasi penting (verifikasi email, notifikasi keamanan).
              </li>
              <li>
                <strong>Nama</strong> — digunakan untuk personalisasi tampilan
                (sapaan di dashboard).
              </li>
              <li>
                <strong>Password (hash)</strong> — disimpan dalam bentuk
                terenkripsi bcrypt. Kami tidak menyimpan password plain-text.
              </li>
            </ul>

            <h3>2.2 Data yang Dibuat Saat Menggunakan Layanan</h3>
            <ul>
              <li>
                <strong>Ide produk</strong> — teks yang kamu input di form
                generate PRD.
              </li>
              <li>
                <strong>PRD markdown</strong> — dokumen PRD yang dihasilkan AI.
              </li>
              <li>
                <strong>Riwayat chat revisi</strong> — instruksi revisi dan
                respons AI.
              </li>
              <li>
                <strong>Timestamp</strong> — kapan PRD dibuat dan diupdate.
              </li>
              <li>
                <strong>Tags library</strong> — library yang terdeteksi dari ide
                kamu (mis. "next.js", "supabase").
              </li>
            </ul>

            <h3>2.3 Data Teknis Otomatis</h3>
            <ul>
              <li>
                <strong>IP address</strong> — sementara, untuk rate limiting dan
                deteksi penyalahgunaan. Tidak disimpan permanen.
              </li>
              <li>
                <strong>User agent</strong> — jenis browser dan OS, untuk
                keperluan debugging.
              </li>
              <li>
                <strong>Cookie sesi</strong> — token JWT NextAuth untuk menjaga
                sesi login. Tidak digunakan untuk tracking.
              </li>
            </ul>

            <h2>3. Penggunaan Data</h2>
            <p>Data kamu digunakan untuk:</p>
            <ul>
              <li>
                Menyediakan fitur generate PRD, chat revisi, dan export markdown.
              </li>
              <li>
                Mengirim email verifikasi dan notifikasi keamanan penting.
              </li>
              <li>
                Mencegah penyalahgunaan (rate limiting, deteksi spam, blokir IP
                berbahaya).
              </li>
              <li>
                Menganalisis penggunaan agregat (jumlah user, jumlah PRD) untuk
                branding di landing page — <strong>tanpa mengidentifikasi
                individu</strong>.
              </li>
              <li>
                Mengirim ide produk dan PRD ke AI provider (Anthropic atau Z.ai)
                untuk diproses. Lihat bagian 5.
              </li>
            </ul>
            <p>
              <strong>Kami TIDAK menjual</strong> data kamu ke pihak ketiga.
              Kamu tidak akan menerima email marketing dari kami.
            </p>

            <h2>4. Dasar Hukum Pemrosesan</h2>
            <p>
              Sesuai UU PDP Indonesia, kami memproses data kamu berdasarkan:
            </p>
            <ul>
              <li>
                <strong>Persetujuan</strong> (Pasal 20 ayat 1) — kamu memberikan
                persetujuan saat mendaftar.
              </li>
              <li>
                <strong>Pelaksanaan kontrak</strong> (Pasal 20 ayat 2) — untuk
                memberikan Layanan yang kamu minta.
              </li>
              <li>
                <strong>Kepentingan sah</strong> (Pasal 20 ayat 3) — untuk
                keamanan, pencegahan penyalahgunaan, dan keberlanjutan Layanan.
              </li>
            </ul>

            <h2>5. Pemrosesan oleh Pihak Ketiga</h2>
            <p>
              Data kamu diproses oleh provider berikut untuk menyediakan Layanan:
            </p>
            <ul>
              <li>
                <strong>Anthropic (Claude)</strong> — memproses ide produk dan PRD
                markdown untuk menghasilkan dan merevisi PRD. Anthropic tidak
                menggunakan data kamu untuk training model. Privacy policy:{" "}
                <a href="https://www.anthropic.com/legal/privacy">
                  anthropic.com/legal/privacy
                </a>
                .
              </li>
              <li>
                <strong>Z.ai (GLM)</strong> — provider AI alternatif jika
                Anthropic tidak dikonfigurasi. Privacy policy:{" "}
                <a href="https://chat.z.ai/privacy">chat.z.ai/privacy</a>.
              </li>
              <li>
                <strong>Context7</strong> — jika fitur aktif, nama library yang
                terdeteksi dari ide kamu akan dikirim untuk fetch dokumentasi.
                Privacy policy:{" "}
                <a href="https://context7.com/privacy">context7.com/privacy</a>.
              </li>
              <li>
                <strong>Vercel</strong> — hosting website. Vercel memproses IP
                address dan request logs. Privacy policy:{" "}
                <a href="https://vercel.com/legal/privacy-policy">
                  vercel.com/legal/privacy-policy
                </a>
                .
              </li>
              <li>
                <strong>Resend</strong> — mengirim email verifikasi. Hanya email
                address dan konten email yang diproses. Privacy policy:{" "}
                <a href="https://resend.com/legal/privacy-policy">
                  resend.com/legal/privacy-policy
                </a>
                .
              </li>
              <li>
                <strong>Database provider</strong> (Neon/Supabase/SQLite lokal) —
                menyimpan seluruh data akun dan PRD.
              </li>
            </ul>

            <h2>6. Penyimpanan dan Retensi Data</h2>
            <ul>
              <li>
                <strong>Data akun:</strong> disimpan selama akun aktif. Akun
                tidak aktif selama 24 bulan akan dihapus otomatis.
              </li>
              <li>
                <strong>Data PRD:</strong> disimpan selama akun aktif. Tidak ada
                expiry otomatis untuk PRD.
              </li>
              <li>
                <strong>Riwayat chat:</strong> disimpan terhubung dengan PRD.
                Hapus PRD = hapus riwayat chat.
              </li>
              <li>
                <strong>Log teknis (IP, user agent):</strong> tidak disimpan
                permanen. Hanya untuk rate limiting in-memory.
              </li>
              <li>
                <strong>Email verifikasi token:</strong> kedaluwarsa 24 jam.
              </li>
            </ul>

            <h2>7. Keamanan Data</h2>
            <p>Kami menerapkan langkah keamanan berikut:</p>
            <ul>
              <li>
                <strong>Password hashing:</strong> bcrypt dengan salt 10 rounds.
              </li>
              <li>
                <strong>Transport encryption:</strong> HTTPS/TLS untuk semua
                koneksi.
              </li>
              <li>
                <strong>Database encryption:</strong> at-rest encryption oleh
                provider (Neon/Supabase).
              </li>
              <li>
                <strong>JWT secret:</strong> NEXTAUTH_SECRET acak 32-byte untuk
                signing session token.
              </li>
              <li>
                <strong>Rate limiting:</strong> mencegah brute force dan abuse.
              </li>
              <li>
                <strong>Isolasi data:</strong> setiap Pengguna hanya bisa akses
                PRD miliknya sendiri. Tidak ada cross-user access.
              </li>
            </ul>
            <p>
              Meskipun demikian, tidak ada sistem yang 100% aman. Jika terjadi
              insiden keamanan, kami akan memberitahu kamu dalam 72 jam via email
              sesuai Pasal 46 UU PDP.
            </p>

            <h2>8. Hak Pengguna (UU PDP Pasal 5-13)</h2>
            <p>Kamu berhak untuk:</p>
            <ul>
              <li>
                <strong>Akses data</strong> — minta salinan seluruh data kamu.
              </li>
              <li>
                <strong>Koreksi data</strong> — perbaiki data yang tidak akurat.
              </li>
              <li>
                <strong>Penghapusan data</strong> — hapus akun dan seluruh data
                terkait.
              </li>
              <li>
                <strong>Pembatasan pemrosesan</strong> — minta kami berhenti
                memproses data untuk tujuan tertentu.
              </li>
              <li>
                <strong>Portabilitas data</strong> — minta data dalam format
                terstruktur (JSON/Markdown).
              </li>
              <li>
                <strong>Penarikan persetujuan</strong> — kapan saja, dengan
                konsekuensi akun dihapus.
              </li>
            </ul>
            <p>
              Untuk menggunakan hak ini, email ke{" "}
              <a href="mailto:privacy@prdkit.app">privacy@prdkit.app</a> dengan
              subjek "Permintaan Hak PDP". Kami respons dalam 30 hari kerja.
            </p>

            <h2>9. Cookie</h2>
            <p>
              PRDKit hanya menggunakan 1 cookie esensial: <code>next-auth.session-token</code>{" "}
              (atau <code>__Secure-next-auth.session-token</code> di production).
              Cookie ini menyimpan JWT session untuk menjaga login. Tidak ada
              cookie tracking, analytics, atau iklan.
            </p>

            <h2>10. Anak di Bawah Umur</h2>
            <p>
              Layanan ini tidak ditujukan untuk anak di bawah 13 tahun. Kami
              tidak sengaja mengumpulkan data dari anak di bawah umur. Jika kamu
              orang tua/wali dan tahu anak kamu mendaftar tanpa izin, hubungi
              kami untuk penghapusan akun.
            </p>

            <h2>11. Transfer Data Lintas Negara</h2>
            <p>
              Data kamu mungkin diproses di luar Indonesia (AS, Eropa, Singapura)
              oleh provider kami (Anthropic, Vercel, Resend, Neon/Supabase). Kami
              hanya menggunakan provider yang telah memenuhi standar privasi
              internasional (GDPR/CCPA equivalent).
            </p>

            <h2>12. Perubahan Kebijakan</h2>
            <p>
              Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan
              signifikan akan dikomunikasikan via email 30 hari sebelum berlaku.
              Versi terbaru selalu tersedia di halaman ini.
            </p>

            <h2>13. Kontak</h2>
            <p>
              Pertanyaan tentang privasi atau permintaan hak PDP dapat dikirim
              ke{" "}
              <a href="mailto:privacy@prdkit.app">privacy@prdkit.app</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
