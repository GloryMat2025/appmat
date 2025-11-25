export interface ModelResponse {
  success: boolean;
  model: string;
  output: string;
}

const TIMEOUT_MS = 6000;

export async function askModel(prompt: string): Promise<ModelResponse> {
  try {
    return await withTimeout(primaryClaude(prompt), TIMEOUT_MS);
  } catch {
    try {
      return await withTimeout(fallbackClaude(prompt), TIMEOUT_MS);
    } catch {
      return await safeOpenAIMini(prompt);
    }
  }
}

/* ------------------------------
   Primary Model — Claude Sonnet 4.5
-------------------------------- */
async function primaryClaude(prompt: string): Promise<ModelResponse> {
  const key = import.meta.env.VITE_CLAUDE_API_KEY!;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3.7-sonnet",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const json = await res.json();

  return {
    success: true,
    model: "claude-3.7-sonnet",
    output: json.content?.[0]?.text || ""
  };
}

/* ---------------------------------
   Fallback Model — Claude Haiku
----------------------------------- */
async function fallbackClaude(prompt: string): Promise<ModelResponse> {
  const key = import.meta.env.VITE_CLAUDE_API_KEY!;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const json = await res.json();

  return {
    success: true,
    model: "claude-3-haiku",
    output: json.content?.[0]?.text || ""
  };
}

/* ---------------------------------
   Safe fallback — GPT-4o-mini
----------------------------------- */
async function safeOpenAIMini(prompt: string): Promise<ModelResponse> {
  const key = import.meta.env.VITE_OPENAI_KEY!;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const json = await res.json();

  return {
    success: true,
    model: "gpt-4o-mini",
    output: json.choices?.[0]?.message?.content || ""
  };
}

/* ---------------------------------
   Timeout Wrapper
----------------------------------- */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
