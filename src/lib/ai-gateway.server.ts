// Server-only: streams a Lovable AI Gateway /v1/responses call and returns the final text.
export type AiResult = { text: string; error?: undefined } | { text?: undefined; error: string };

export async function streamResponsesText(body: Record<string, unknown>): Promise<AiResult> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { error: "AI is not configured for this app yet." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: "openai/gpt-6-astra", store: false, stream: true, reasoning: { effort: "low" }, ...body }),
  });
  if (!res.ok || !res.body) {
    let msg = "";
    try { const j = (await res.json()) as { error?: { message?: string }; message?: string }; msg = j.error?.message ?? j.message ?? ""; } catch { /* ignore */ }
    console.error("AI gateway error", res.status, msg);
    if (res.status === 429) return { error: "The AI is busy right now. Please try again in a minute." };
    if (res.status === 402) return { error: msg || "AI credits have run out for this workspace." };
    if (res.status === 403) return { error: msg || "AI access is not allowed for this workspace." };
    return { error: msg || `AI request failed (${res.status}).` };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data) as { type?: string; delta?: string; response?: { error?: { message?: string } }; message?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        else if (ev.type === "response.failed" || ev.type === "error") return { error: ev.response?.error?.message ?? ev.message ?? "AI request failed." };
      } catch { /* partial frame */ }
    }
  }
  if (!text.trim()) return { error: "The AI returned an empty answer." };
  return { text };
}
