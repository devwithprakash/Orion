import { AgentPlan, AgentPlanSchema } from "./schemas";
import { buildSystemPrompt } from "./system-prompt";
import { getTodayUtc } from "./usage";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";
const TIMEOUT_MS = 30_000;

/**
 * Call the OpenRouter API with the user's prompt and return a parsed AgentPlan.
 * Throws if the response cannot be parsed into a valid AgentPlan.
 */
export async function callOpenRouter(
  userPrompt: string,
  userTimeZone?: string
): Promise<AgentPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = buildSystemPrompt(getTodayUtc(), userTimeZone);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let raw: string;
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://orion.app",
        "X-Title": "Orion AI Agent",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2, // low temp for deterministic structured output
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    raw = data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }

  if (!raw) {
    throw new Error("OpenRouter returned an empty response");
  }

  // Strip markdown code fences if the model wrapped the JSON
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const result = AgentPlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response did not match expected schema: ${JSON.stringify(result.error.flatten())}`
    );
  }

  return result.data;
}

/**
 * Secondary AI call: takes raw email threads and generates a clean,
 * readable summary for the user.
 */
export async function callOpenRouterForEmailSummary(
  emails: { from: string; subject: string | null; snippet: string }[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const emailText = emails
    .map(
      (e, i) =>
        `Email ${i + 1}:\nFrom: ${e.from}\nSubject: ${e.subject ?? "No Subject"}\nSnippet: ${e.snippet}\n`
    )
    .join("\n");

  const prompt = `You are a helpful workspace assistant. Please summarize the following ${emails.length} recent emails clearly and concisely. Group related items if necessary. Do not include pleasantries, just provide the summary directly.\n\n${emailText}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://orion.app",
        "X-Title": "Orion Workspace",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() ?? "No summary generated.";
  } catch (error) {
    console.error("[callOpenRouterForEmailSummary] Error:", error);
    return "Failed to generate summary from the emails.";
  } finally {
    clearTimeout(timeout);
  }
}
