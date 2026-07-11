type Message = { role: string; content: string };

// Every configured provider/model pair, tried in order until one answers.
// Gemini (free per-account quota, no shared queue) is preferred when a key
// exists; OpenRouter's :free pools rate-limit often, so they come after.
function candidates() {
  const tries: { url: string; key: string; model: string }[] = [];
  const gemini = process.env.GEMINI_API_KEY;
  // Models before the 3.x family are closed to API keys created after March 2026.
  if (gemini) for (const model of [process.env.GEMINI_MODEL || "gemini-3.1-flash-lite", "gemini-3.5-flash"])
    tries.push({ url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: gemini, model });
  const openrouter = process.env.OPENROUTER_API_KEY;
  if (openrouter) for (const model of [process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free", "qwen/qwen3-next-80b-a3b-instruct:free", "meta-llama/llama-3.3-70b-instruct:free"])
    tries.push({ url: "https://openrouter.ai/api/v1/chat/completions", key: openrouter, model });
  return tries;
}

export const configured = () => candidates().length > 0;

export async function chat(messages: Message[], { maxTokens, temperature, timeoutMs }: { maxTokens: number; temperature: number; timeoutMs: number }): Promise<{ content?: string; model?: string; error?: string }> {
  const errors: string[] = [];
  for (const t of candidates()) {
    try {
      const response = await fetch(t.url, {
        method: "POST",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Authorization: `Bearer ${t.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: t.model, temperature, max_tokens: maxTokens, messages })
      });
      if (!response.ok) { errors.push(`${t.model}: ${response.status} ${(await response.text().catch(() => "")).slice(0, 160)}`); continue; }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return { content, model: t.model };
      errors.push(`${t.model}: empty response`);
    } catch (e) { errors.push(`${t.model}: ${e instanceof Error ? e.name : "failed"}`); }
  }
  return { error: errors.length ? errors.join(" | ") : "No AI key is configured." };
}
