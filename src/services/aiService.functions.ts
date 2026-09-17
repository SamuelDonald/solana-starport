import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ideaInput = z.object({
  prompt: z.string().min(2).max(300),
});

const rewriteInput = z.object({
  name: z.string().max(48),
  symbol: z.string().max(12),
  description: z.string().min(2).max(500),
});

export interface TokenIdea {
  name: string;
  symbol: string;
  description: string;
}

const IDEA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          symbol: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "symbol", "description"],
      },
    },
  },
  required: ["suggestions"],
} as const;

const REWRITE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { description: { type: "string" } },
  required: ["description"],
} as const;

/** Calls the Lovable AI gateway Responses API and returns the parsed JSON output. */
async function generateJson(params: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: unknown;
}): Promise<unknown> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project yet.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: params.instructions,
      input: params.input,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: params.schemaName,
          strict: true,
          schema: params.schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("AI is busy right now — try again shortly.");
    if (res.status === 402)
      throw new Error("AI credits are used up. Add credits to keep using AI ideas.");
    const detail = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && event.delta) {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          text = event.response.output_text;
        }
      } catch {
        /* ignore malformed keepalive frames */
      }
    }
  }

  if (!text.trim()) throw new Error("The AI didn't return anything. Try again.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The AI returned an unreadable answer. Try again.");
  }
}

export const suggestTokenIdeas = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ideaInput.parse(data))
  .handler(async ({ data }): Promise<TokenIdea[]> => {
    const parsed = await generateJson({
      instructions:
        "You name Solana memecoins. Return exactly 4 suggestions. Each name is at most 32 characters, each symbol is 3-8 uppercase letters with no $ sign, each description is one punchy sentence under 160 characters. Keep it fun, original and safe for work. Never promise financial returns.",
      input: `Theme or vibe from the creator: ${data.prompt}`,
      schemaName: "token_ideas",
      schema: IDEA_SCHEMA,
    });

    const shape = z.object({
      suggestions: z.array(
        z.object({ name: z.string(), symbol: z.string(), description: z.string() }),
      ),
    });
    const result = shape.parse(parsed);

    return result.suggestions.slice(0, 5).map((s) => ({
      name: s.name.trim().slice(0, 48),
      symbol: s.symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12),
      description: s.description.trim().slice(0, 500),
    }));
  });

export const improveTokenDescription = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rewriteInput.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const parsed = await generateJson({
      instructions:
        "You rewrite Solana memecoin descriptions. Return one improved description under 300 characters, energetic but honest. Never promise profits or financial returns.",
      input: `Token: ${data.name || "unnamed"} (${data.symbol || "no ticker"}).\nCurrent description: ${data.description}`,
      schemaName: "token_description",
      schema: REWRITE_SCHEMA,
    });

    const shape = z.object({ description: z.string() });
    return shape.parse(parsed).description.trim().slice(0, 500);
  });
