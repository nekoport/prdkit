import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Syarat & Ketentuan — PRDKit",
  description:
    "Syarat dan ketentuan penggunaan layanan PRDKit, generator PRD gratis untuk AI coding.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Syarat &amp; Ketentuan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Terakhir diperbarui: 25 Juni 2026
          </p>

          <div className="prose-prd mt-10">
            <h2>1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mendaftar dan menggunakan PRDKit ("Layanan"), kamu setuju
              untuk terikat oleh syarat dan ketentuan ini. Jika kamu tidak setuju
              dengan salah satu bagian, mohon jangan menggunakan Layanan ini.
            </p>

            <h2>2. Definisi</h2>
            <ul>
              <li>
                <strong>"Layanan"</strong> merujuk pada platform PRDKit, termasuk
                website, fitur generate PRD, fitur revisi chat, dan fitur export.
              </li>
              <li>
                <strong>"Pengguna"</strong> merujuk pada individu yang mendaftar
                dan menggunakan Layanan.
              </li>
              <li>
                <strong>"Konten Pengguna"</strong> merujuk pada ide produk, PRD
                yang dihasilkan, dan riwayat chat revisi yang dibuat oleh
                Pengguna.
              </li>
              <li>
                <strong>"AI"</strong> merujuk pada model bahasa besar (LLM) yang
                digunakan untuk menghasilkan dan merevisi PRD.
              </li>
            </ul>

            <h2>3. Akun Pengguna</h2>
            <p>
              Untuk menggunakan Layanan, kamu perlu membuat akun dengan email
              yang valid. Kamu bertanggung jawab untuk:
            </p>
            <ul>
              <li>Menjaga kerahasiaan password akun kamu.</li>
              <li>
                Semua aktivitas yang terjadi di bawah akun kamu, termasuk
                generate PRD dan revisi.
              </li>
              <li>
                Memberikan informasi yang akurat saat mendaftar (nama dan email).
              </li>
              <li>
                Tidak membuat akun palsu atau menggunakan email orang lain tanpa
                izin.
              </li>
            </ul>

            <h2>4. Penggunaan yang Dilarang</h2>
            <p>Kamu setuju untuk tidak menggunakan Layanan untuk:</p>
            <ul>
              <li>
                Generate PRD untuk produk yang melanggar hukum Indonesia atau
                negara asal kamu.
              </li>
              <li>
                Mengirim spam, malware, atau konten berbahaya melalui form ide.
              </li>
              <li>
                Mencoba mengakses sistem internal PRDKit tanpa otorisasi
                (termasuk scraping, brute force, atau SQL injection).
              </li>
              <li>
                Melewati rate limit dengan akun palsu atau teknik lain.
              </li>
              <li>
                Menyalahgunakan Layanan untuk tujuan yang dapat merugikan AI
                provider (Anthropic, Z.ai) atau Context7.
              </li>
            </ul>

            <h2>5. Konten Pengguna</h2>
            <p>
              Kamu mempertahankan kepemilikan penuh atas ide produk yang kamu
              input dan PRD yang dihasilkan. PRDKit tidak mengklaim kepemilikan
              atas Konten Pengguna.
            </p>
            <p>
              PRDKit tidak meng-share PRD kamu ke publik secara default. Semua
              PRD bersifat privat dan hanya dapat diakses oleh pemilik akun.
            </p>

            <h2>6. Batasan Layanan Gratis</h2>
            <p>
              Layanan ini disediakan gratis dengan batasan berikut untuk
              memastikan keberlanjutan operasional:
            </p>
            <ul>
              <li>
                <strong>Generate PRD:</strong> 10 PRD per 24 jam per Pengguna.
              </li>
              <li>
                <strong>Revisi via Chat:</strong> 50 revisi per 24 jam per
                Pengguna.
              </li>
              <li>
                <strong>Penyimpanan:</strong> Tidak ada batasan jumlah PRD total
                yang dapat disimpan per akun.
              </li>
            </ul>
            <p>
              PRDKit berhak mengubah batasan ini sewaktu-waktu dengan
              pemberitahuan melalui email atau in-app notification.
            </p>

            <h2>7. Ketersediaan Layanan</h2>
            <p>
              Layanan disediakan "sebagaimana adanya" tanpa jaminan
              ketersediaan. PRDKit tidak bertanggung jawab atas:
            </p>
            <ul>
              <li>
                Downtime yang disebabkan oleh provider AI (Anthropic, Z.ai) atau
                infrastruktur (Vercel, database).
              </li>
              <li>
                Kualitas PRD yang dihasilkan — AI dapat menghasilkan konten yang
                tidak akurat atau tidak sesuai ekspektasi.
              </li>
              <li>
                Kehilangan data akibat kegagalan infrastruktur atau insiden
                keamanan.
              </li>
            </ul>

            <h2>8. Hak Kekayaan Intelektual</h2>
            <p>
              Kode sumber PRDKit, desain, merek dagang, dan dokumentasi adalah
              milik PRDKit. Kamu tidak diperbolehkan:
            </p>
            <ul>
              <li>Menyalin atau mendistribusikan kode PRDKit tanpa izin.</li>
              <li>
                Menggunakan nama "PRDKit" atau logo untuk produk komersial tanpa
                izin tertulis.
              </li>
              <li>
                Membuat layanan tiruan yang meniru tampilan atau fitur PRDKit
                untuk keuntungan komersial.
              </li>
            </ul>

            <h2>9. Donasi</h2>
            <p>
              Layanan ini gratis. Donasi melalui link Saweria/Trakteer/Buy Me a
              Coffee bersifat sukarela dan tidak memberikan hak khusus kepada
              donatur (kecuali disebutkan lain). Donasi digunakan untuk
              menutupi biaya operasional: API AI, hosting, dan domain.
            </p>

            <h2>10. Penghapusan Akun</h2>
            <p>
              Kamu dapat menghapus akun kapan saja dengan menghubungi{" "}
              <a href="mailto:support@prdkit.app">support@prdkit.app</a>.
              Penghapusan akun akan menghapus semua PRD dan riwayat chat yang
              terkait secara permanen dalam 30 hari.
            </p>

            <h2>11. Perubahan Ketentuan</h2>
            <p>
              PRDKit berhak mengubah syarat dan ketentuan ini sewaktu-waktu.
              Perubahan akan diumumkan melalui email atau banner in-app minimal 7
              hari sebelum berlaku. Penggunaan Layanan setelah perubahan berlaku
              dianggap sebagai persetujuan terhadap ketentuan baru.
            </p>

            <h2>12. Hukum yang Berlaku</h2>
            <p>
              Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa
              akan diselesaikan secara musyawarah, dan jika tidak tercapai, akan
              diselesaikan melalui pengadilan negeri yang berwenang.
            </p>

            <h2>13. Kontak</h2>
            <p>
              Pertanyaan tentang ketentuan ini dapat dikirim ke{" "}
              <a href="mailto:support@prdkit.app">support@prdkit.app</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
