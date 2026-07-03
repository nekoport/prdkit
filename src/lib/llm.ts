/**
 * LLM client untuk PRD generation.
 *
 * Provider priority (descending):
 * 1. Anthropic Claude Sonnet 4.5  — jika ANTHROPIC_API_KEY diset
 * 2. AgentRouter GLM 5.2          — jika AGENTROUTER_API_KEY diset (OpenAI-compatible)
 * 3. Z.AI (z-ai-web-dev-sdk)      — fallback default (gratis di environment ini)
 *
 * Semua path mengembalikan format yang sama: string markdown PRD.
 *
 * GLM 5.2 via AgentRouter:
 * - Endpoint: https://agentrouter.org/v1/chat/completions (OpenAI-compatible)
 * - Auth: Bearer sk-...
 * - Model ID: glm-5.2
 * - Dapat $200 free credits saat signup via referral
 */

import ZAI from "z-ai-web-dev-sdk";
import { PRD_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prd-prompt";

export interface GeneratePrdInput {
  idea: string;
  context7Snippets?: string[]; // optional docs from Context7
  onToken?: (chunk: string) => void;
}

export interface GeneratePrdOutput {
  markdown: string;
  model: string;
  durationMs: number;
}

// Provider detection
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const agentRouterKey = process.env.AGENTROUTER_API_KEY;

// AgentRouter config
const AGENTROUTER_BASE_URL = "https://agentrouter.org/v1";
const AGENTROUTER_MODEL = process.env.AGENTROUTER_MODEL || "glm-5.2";

/**
 * Get active provider name (untuk debug + UI display).
 */
export function getActiveProvider(): string {
  if (anthropicKey) return "anthropic-claude";
  if (agentRouterKey) return "agentrouter-glm";
  return "zai-fallback";
}

export async function generatePrd(
  input: GeneratePrdInput
): Promise<GeneratePrdOutput> {
  const start = Date.now();
  const userPrompt = buildUserPrompt(input.idea, input.context7Snippets || []);

  let markdown: string;
  let model: string;

  if (anthropicKey) {
    const result = await generateWithAnthropic(userPrompt, input.onToken);
    markdown = result.text;
    model = result.model;
  } else if (agentRouterKey) {
    const result = await generateWithAgentRouter(
      userPrompt,
      input.onToken
    );
    markdown = result.text;
    model = result.model;
  } else {
    const result = await generateWithZai(userPrompt, input.onToken);
    markdown = result.text;
    model = result.model;
  }

  return {
    markdown: markdown.trim(),
    model,
    durationMs: Date.now() - start,
  };
}

export async function revisePrd(
  currentMarkdown: string,
  instruction: string
): Promise<{ markdown: string; model: string }> {
  const systemRevise = `Kamu adalah asisten yang merevisi PRD yang sudah ada.
Aturan:
- Hanya keluarkan PRD final yang sudah direvisi (full markdown).
- Jangan tambahkan penjelasan di luar PRD.
- Pertahankan struktur 10-section yang sudah ada.
- Bahasa: Indonesia, kecuali user minta bahasa lain.`;

  const userRevise = `PRD saat ini:
\`\`\`markdown
${currentMarkdown}
\`\`\`

Instruksi revisi dari user:
${instruction}

Keluaran: PRD lengkap yang sudah direvisi, dalam satu blok markdown.`;

  if (anthropicKey) {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: anthropicKey });
    const model = "claude-sonnet-4-5-20250929";
    const msg = await client.messages.create({
      model,
      max_tokens: 8000,
      system: systemRevise,
      messages: [{ role: "user", content: userRevise }],
    });
    const text = msg.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    return { markdown: text.trim(), model };
  }

  if (agentRouterKey) {
    const result = await callAgentRouter({
      systemPrompt: systemRevise,
      userPrompt: userRevise,
      onToken: undefined, // revise pakai non-streaming untuk simplicity
    });
    return { markdown: result.text.trim(), model: result.model };
  }

  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: systemRevise },
      { role: "user", content: userRevise },
    ],
    thinking: { type: "disabled" },
  });
  const text = completion.choices[0]?.message?.content || "";
  return { markdown: text.trim(), model: "zai-default" };
}

// ─── Anthropic Claude ─────────────────────────────────────────
async function generateWithAnthropic(
  userPrompt: string,
  onToken?: (c: string) => void
): Promise<{ text: string; model: string }> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: anthropicKey! });
  const model = "claude-sonnet-4-5-20250929";

  if (onToken) {
    const stream = client.messages.stream({
      model,
      max_tokens: 6000,
      system: PRD_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    let text = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        text += event.delta.text;
        onToken(event.delta.text);
      }
    }
    return { text, model };
  }

  const msg = await client.messages.create({
    model,
    max_tokens: 8000,
    system: PRD_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = msg.content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("");
  return { text, model };
}

// ─── AgentRouter GLM 5.2 (OpenAI-compatible) ─────────────────
interface AgentRouterParams {
  systemPrompt: string;
  userPrompt: string;
  onToken?: (c: string) => void;
}

async function generateWithAgentRouter(
  userPrompt: string,
  onToken?: (c: string) => void
): Promise<{ text: string; model: string }> {
  return callAgentRouter({
    systemPrompt: PRD_SYSTEM_PROMPT,
    userPrompt,
    onToken,
  });
}

async function callAgentRouter({
  systemPrompt,
  userPrompt,
  onToken,
}: AgentRouterParams): Promise<{ text: string; model: string }> {
  const model = AGENTROUTER_MODEL;

  // Streaming mode
  if (onToken) {
    const res = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agentRouterKey}`,
        "User-Agent": "opencode/1.15.12",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_tokens: 8000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(180000), // 3 minutes
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `AgentRouter error (${res.status}): ${errText.slice(0, 200)}`
      );
    }

    if (!res.body) {
      throw new Error("AgentRouter: streaming tidak didukung");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content || "";
          if (delta) {
            text += delta;
            onToken(delta);
          }
        } catch {
          // ignore parse errors (keepalive lines, etc.)
        }
      }
    }
    return { text, model: `agentrouter-${model}` };
  }

  // Non-streaming mode
  const res = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentRouterKey}`,
      "User-Agent": "opencode/1.15.12",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AgentRouter error (${res.status}): ${errText.slice(0, 200)}`
    );
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || "";
  return { text, model: `agentrouter-${model}` };
}

// ─── Z.AI fallback ────────────────────────────────────────────
async function generateWithZai(
  userPrompt: string,
  onToken?: (c: string) => void
): Promise<{ text: string; model: string }> {
  const zai = await ZAI.create();

  if (onToken) {
    let text = "";
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: PRD_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      thinking: { type: "disabled" },
    } as any);

    for await (const chunk of completion as any) {
      const delta = chunk?.choices?.[0]?.delta?.content || "";
      if (delta) {
        text += delta;
        onToken(delta);
      }
    }
    return { text, model: "zai-stream" };
  }

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: PRD_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });
  const text = completion.choices[0]?.message?.content || "";
  return { text, model: "zai-default" };
}
