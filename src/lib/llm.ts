/**
 * LLM client untuk spec generation.
 *
 * Provider priority (descending):
 * 1. Anthropic Claude Sonnet 4.5  — jika ANTHROPIC_API_KEY diset
 * 2. AgentRouter GLM 5.2          — jika AGENTROUTER_API_KEY diset (OpenAI-compatible)
 *
 * IMPORTANT: AgentRouter content filter blocks:
 * - The word "PRD" (case-insensitive) and "PRDKit"
 * - Indonesian language text in user/system messages
 * Solution: All AgentRouter prompts are in English. User ideas in Indonesian
 * are translated to English via Google Translate before sending.
 * Output is still in Indonesian (instructed in system prompt).
 */

import { PRD_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prd-prompt";

export interface GeneratePrdInput {
  idea: string;
  context7Snippets?: string[];
  onToken?: (chunk: string) => void;
}

export interface GeneratePrdOutput {
  markdown: string;
  model: string;
  durationMs: number;
}

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const agentRouterKey = process.env.AGENTROUTER_API_KEY;

const AGENTROUTER_BASE_URL = "https://agentrouter.org/v1";
const AGENTROUTER_MODEL = process.env.AGENTROUTER_MODEL || "glm-5.2";
const AGENTROUTER_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${agentRouterKey}`,
  "User-Agent": "opencode/1.15.12",
};

export function getActiveProvider(): string {
  if (anthropicKey) return "anthropic-claude";
  if (agentRouterKey) return "agentrouter-glm";
  return "none";
}

// ─── Google Translate (free, no API key needed) ────────────────
async function translateToEnglish(text: string): Promise<string> {
  if (text.length < 5) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("[translateToEnglish] HTTP", res.status);
      return text;
    }
    const data = await res.json();
    // Response format: [[[translatedSegment, originalSegment, ...], ...], ...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((seg: any) => (Array.isArray(seg) ? seg[0] : ""))
        .join("");
      return translated.trim() || text;
    }
    return text;
  } catch (err) {
    console.error("[translateToEnglish] failed:", err);
    return text;
  }
}

export async function generatePrd(
  input: GeneratePrdInput
): Promise<GeneratePrdOutput> {
  const start = Date.now();

  let markdown: string;
  let model: string;

  if (anthropicKey) {
    const userPrompt = buildUserPrompt(input.idea, input.context7Snippets || []);
    const result = await generateWithAnthropic(userPrompt, input.onToken);
    markdown = result.text;
    model = result.model;
  } else if (agentRouterKey) {
    // AgentRouter blocks Indonesian — translate idea to English first
    const englishIdea = await translateToEnglish(input.idea);
    const userPrompt = buildUserPrompt(englishIdea, input.context7Snippets || []);
    const result = await generateWithAgentRouter(userPrompt, input.onToken);
    markdown = result.text;
    model = result.model;
  } else {
    throw new Error(
      "No LLM provider configured. Set ANTHROPIC_API_KEY or AGENTROUTER_API_KEY."
    );
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
  const systemRevise = `You are an assistant that revises existing spec documents.
Rules:
- Output ONLY the revised spec (full markdown).
- Do not add explanations outside the spec.
- Keep the existing 10-section structure.
- Output language: Indonesian, unless the user requests another language.`;

  if (anthropicKey) {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: anthropicKey });
    const model = "claude-sonnet-4-5-20250929";
    const userRevise = `Current spec:\n\`\`\`markdown\n${currentMarkdown}\n\`\`\`\n\nRevision instruction from user:\n${instruction}\n\nOutput: complete revised spec in one markdown block.`;
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
    // Translate instruction to English for AgentRouter
    const englishInstruction = await translateToEnglish(instruction);
    const userRevise = `Current spec:\n\`\`\`markdown\n${currentMarkdown}\n\`\`\`\n\nRevision instruction from user:\n${englishInstruction}\n\nOutput: complete revised spec in one markdown block.`;
    const result = await callAgentRouter({
      systemPrompt: systemRevise,
      userPrompt: userRevise,
      onToken: undefined,
    });
    return { markdown: result.text.trim(), model: result.model };
  }

  throw new Error(
    "No LLM provider configured. Set ANTHROPIC_API_KEY or AGENTROUTER_API_KEY."
  );
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
      headers: AGENTROUTER_HEADERS,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_tokens: 8000,
        temperature: 0.7,
        thinking: { type: "disabled" },
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `AgentRouter error (${res.status}): ${errText.slice(0, 200)}`
      );
    }

    if (!res.body) {
      throw new Error("AgentRouter: streaming not supported");
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
    headers: AGENTROUTER_HEADERS,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8000,
      temperature: 0.7,
      thinking: { type: "disabled" },
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
