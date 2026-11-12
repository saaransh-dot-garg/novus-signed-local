import { Router, type Response } from "express";
import { trackServerEvent } from "../analytics/pendoTrack.js";
import { requireAuth, type AuthedLocals } from "../auth.js";
import { notebooks } from "../store.js";

export const assistantRouter = Router();
assistantRouter.use(requireAuth);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
}

function notebookContext(organizationId: string): string {
  const lines = [...notebooks.values()]
    .filter((notebook) => notebook.organizationId === organizationId)
    .map((notebook) => {
      const notes = notebook.notes.map((note) => `  - ${note.body}`).join("\n");
      return `Notebook "${notebook.title}":\n${notes || "  (no notes)"}`;
    });
  return lines.join("\n\n") || "The researcher has no notebooks yet.";
}

async function askOpenAi(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

assistantRouter.post("/", async (req, res: Response<unknown, AuthedLocals>) => {
  const messages: unknown = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    res.status(400).json({ error: "messages must be a non-empty list of chat messages" });
    return;
  }

  const context = notebookContext(res.locals.organization.id);
  const system =
    "You are the Fieldnotes research assistant. Answer questions about the researcher's " +
    `field notes, and suggest what to observe next.\n\n${context}`;

  const notebookCount = [...notebooks.values()].filter(
    (notebook) => notebook.organizationId === res.locals.organization.id
  ).length;
  // assistant_response_received: records how each assistant request ended.
  const trackResponse = (outcome: "answered" | "not_configured" | "failed", model: string) =>
    trackServerEvent(
      "assistant_response_received",
      res.locals.user.id,
      res.locals.organization.id,
      {
        model,
        outcome,
        messageCount: messages.length,
        notebookCount,
        organizationId: res.locals.organization.id,
      }
    );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    trackResponse("not_configured", "none");
    res.json({
      reply: `The assistant is not configured (set OPENAI_API_KEY). You have ${notebookCount} notebook(s).`,
      model: null,
    });
    return;
  }

  try {
    const reply = await askOpenAi(apiKey, system, messages);
    trackResponse("answered", MODEL);
    res.json({ reply, model: MODEL });
  } catch (error) {
    console.error("Assistant request failed", error);
    trackResponse("failed", MODEL);
    res.status(502).json({ error: "The assistant is unavailable right now" });
  }
});
