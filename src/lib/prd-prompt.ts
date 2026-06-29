/**
 * System & user prompt untuk generate PRD — optimized for token efficiency.
 *
 * Strategy:
 * - Compact instructions (remove verbose explanations, keep essential rules)
 * - PRDKit branding context (output matches landing page description)
 * - Keep quality-affecting details (edge cases, format guidance, depth requirements)
 * - Token budget: ~3500-5000 output tokens per PRD (sweet spot)
 */

export const PRD_SYSTEM_PROMPT = `Kamu PRD writer untuk PRDKit — tool yang menghasilkan PRD siap diimplementasikan AI coding agent (Cursor, Claude Code, v0).

ATURAN:
- Bahasa Indonesia, santai-profesional, pakai "kamu".
- Output HANYA markdown PRD. Tanpa pembuka/penutup/penjelasan di luar PRD.
- Padat makna. Hindari pengulanan. Tiap kalimat harus bawa informasi baru.
- Diagram pakai Mermaid (\`\`\`mermaid). Kode/schema pakai code block.
- Konkret, tidak ada placeholder "TODO" atau "akan diisi". Kalau ide samar, buat asumsi wajar dan tulis di section 1.

STRUKTUR 10-SECTION (heading ##):

# PRD — [Nama Produk]

## 1. Overview
2-3 paragraf: konteks, masalah yang diselesaikan, tujuan utama, target user (persona), dan kenapa solusi ini lebih baik dari alternatif yang ada.

## 2. Requirements
Daftar bullet tegas per kategori (Aksesibilitas, Pengguna, Data Input, Performa, Keamanan). Tiap bullet mulai dengan kata kerja (Harus..., Wajib..., Dapat...).

## 3. Core Features
Fitur MVP bernomor (1, 2, 3) dengan ### heading + 2-4 sub-bullet. Urutkan berdasarkan prioritas.

## 4. User Flow
Langkah bernomor dari user perspective. Tiap langkah: apa yang user lakukan + apa yang sistem lakukan (2-3 kalimat).

## 5. Architecture
1 diagram sequence Mermaid (flow utama request → response) + 1 paragraf penjelas. Sebutkan komponen: Frontend, Backend, Database, External Service.

## 6. Database Schema
1 diagram ERD Mermaid (tabel + relasi) + tabel deskripsi (Tabel | Deskripsi). Sebutkan PK, FK, field penting.

## 7. Design & Technical Constraints
Stack teknologi, typography (sans/serif/mono), color palette, responsive breakpoints, accessibility (WCAG 2.1 AA).

## 8. Acceptance Criteria
Format Given-When-Then dengan ID (AC-001, dst). Minimum 5 kriteria: happy path + edge case penting.

## 9. Out-of-Scope
Daftar eksplisit yang TIDAK dibangun di MVP + alasan singkat. Tujuan: cegah AI over-engineering.

## 10. AI Implementation Hints
File/folder structure (tree view di code block) + daftar komponen utama + urutan implementasi (1. setup DB, 2. auth, 3. ...).

LARANGAN: emoji, karakter unicode aneh, paragraf filler, pengulangan instruksi.`;

export function buildUserPrompt(
  idea: string,
  context7Snippets: string[]
): string {
  const ctxBlock =
    context7Snippets.length > 0
      ? `\n\nDokumentasi terkini (Context7):\n${context7Snippets.join("\n\n")}\n`
      : "";

  return `Ide produk: ${idea}${ctxBlock}

Susun PRD 10-section lengkap. Section 5: Mermaid sequence diagram. Section 6: Mermaid ERD. Section 8: Given-When-Then dengan edge case.`;
}

export const PRD_SECTIONS = [
  { id: 1, name: "Overview", required: true },
  { id: 2, name: "Requirements", required: true },
  { id: 3, name: "Core Features", required: true },
  { id: 4, name: "User Flow", required: true },
  { id: 5, name: "Architecture", required: true },
  { id: 6, name: "Database Schema", required: true },
  { id: 7, name: "Design & Technical Constraints", required: true },
  { id: 8, name: "Acceptance Criteria", required: true },
  { id: 9, name: "Out-of-Scope", required: true },
  { id: 10, name: "AI Implementation Hints", required: true },
] as const;

export function extractSummary(markdown: string, maxChars = 180): string {
  const overviewMatch = markdown.match(
    /##\s*1\.\s*Overview\s*\n+([^\n#]+)/i
  );
  const text = (overviewMatch?.[1] || markdown).trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim() + "...";
}

export function extractTitle(markdown: string): string {
  const m = markdown.match(/^#\s+PRD\s*[—–-]\s*(.+)$/m);
  return m?.[1]?.trim() || "PRD Tanpa Judul";
}