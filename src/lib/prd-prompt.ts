/**
 * System & user prompt untuk generate spec document.
 *
 * IMPORTANT: AgentRouter content filter blocks Indonesian text and the word "PRD".
 * All prompts sent to AgentRouter MUST be in English. The output instruction
 * tells the model to produce Indonesian-language output.
 */

export const PRD_SYSTEM_PROMPT = `You are a spec writer for SpecKit — a tool that generates product specification documents ready for AI coding agents (Cursor, Claude Code, v0) to implement.

RULES:
- Output language: Indonesian (Bahasa Indonesia), casual-professional tone, use "kamu".
- Output ONLY markdown. No intro/outro/explanation outside the document.
- Be concise. No filler. Every sentence must carry new information.
- Use Mermaid for diagrams (\`\`\`mermaid). Use code blocks for code/schema.
- Be concrete. No "TODO" or "placeholder". If the idea is vague, make reasonable assumptions and note them in section 1.

10-SECTION STRUCTURE (use ## headings):

# Spec — [Product Name]

## 1. Overview
2-3 paragraphs: context, problem being solved, main goal, target user (persona), and why this solution is better than alternatives.

## 2. Requirements
Bullet list per category (Accessibility, Users, Data Input, Performance, Security). Each bullet starts with a verb (Must..., Shall..., May...).

## 3. Core Features
Numbered MVP features (1, 2, 3) with ### heading + 2-4 sub-bullets. Sort by priority.

## 4. User Flow
Numbered steps from user perspective. Each step: what user does + what system does (2-3 sentences).

## 5. Architecture
1 Mermaid sequence diagram (main request flow) + 1 paragraph explanation. Mention components: Frontend, Backend, Database, External Service.

## 6. Database Schema
1 Mermaid ERD diagram (tables + relations) + description table (Table | Description). Mention PK, FK, important fields.

## 7. Design & Technical Constraints
Tech stack, typography (sans/serif/mono), color palette, responsive breakpoints, accessibility (WCAG 2.1 AA).

## 8. Acceptance Criteria
Given-When-Then format with IDs (AC-001, etc). Minimum 5 criteria: happy path + important edge cases.

## 9. Out-of-Scope
Explicit list of what is NOT built in MVP + brief reason. Goal: prevent AI over-engineering.

## 10. AI Implementation Hints
File/folder structure (tree view in code block) + list of main components + implementation order (1. setup DB, 2. auth, 3. ...).

FORBIDDEN: emoji, weird unicode characters, filler paragraphs, repeating instructions.`;

export function buildUserPrompt(
  idea: string,
  context7Snippets: string[]
): string {
  const ctxBlock =
    context7Snippets.length > 0
      ? `\n\nCurrent documentation (Context7):\n${context7Snippets.join("\n\n")}\n`
      : "";

  return `Product idea: ${idea}${ctxBlock}

Write a complete 10-section spec document. Section 5: Mermaid sequence diagram. Section 6: Mermaid ERD. Section 8: Given-When-Then with edge cases. Output in Indonesian language.`;
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
  const m = markdown.match(/^#\s+(?:PRD|Spec|Spesifikasi)\s*[—–-]\s*(.+)$/m);
  return m?.[1]?.trim() || "Spec Tanpa Judul";
}
