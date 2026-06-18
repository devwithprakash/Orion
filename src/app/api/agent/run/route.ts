import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConnectionStatus } from "@/lib/connection";
import { callOpenRouter } from "@/lib/agent/openrouter";
import { executeActions } from "@/lib/agent/executor";
import { checkDailyLimit, incrementUsage, getDailyUsage, DAILY_LIMIT } from "@/lib/agent/usage";
import { detectConversationalIntent } from "@/lib/agent/conversation";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: { prompt?: string; timeZone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ message: "prompt is required" }, { status: 400 });
  }

  const timeZone = body?.timeZone;

  // ── 3. Conversational shortcut — no usage consumed ─────────────────────────
  const conversational = detectConversationalIntent(prompt);
  if (conversational.isConversational) {
    return NextResponse.json({
      understood: conversational.response,
      actions: [],
      isConversational: true,
      usage: await getDailyUsage(userId),
    });
  }

  // ── 4. Daily usage limit ───────────────────────────────────────────────────
  const limitCheck = await checkDailyLimit(userId);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        message: `You have reached your daily AI limit of ${DAILY_LIMIT} actions. Please try again tomorrow.`,
        usage: { used: limitCheck.used, remaining: 0, limit: DAILY_LIMIT },
      },
      { status: 429 }
    );
  }

  // ── 5. Connection status ───────────────────────────────────────────────────
  const connections = await getConnectionStatus(userId);

  // ── 6. Call OpenRouter ─────────────────────────────────────────────────────
  let plan;
  try {
    plan = await callOpenRouter(prompt, timeZone);
  } catch (error) {
    console.error("[/api/agent/run] OpenRouter error:", error);
    return NextResponse.json(
      { message: "I couldn't process that request right now. Please try again in a moment." },
      { status: 502 }
    );
  }

  // ── 7. Clarification needed (no actions yet) ───────────────────────────────
  if (plan.clarificationNeeded && (!plan.actions || plan.actions.length === 0)) {
    return NextResponse.json({
      understood: plan.understood,
      clarificationNeeded: plan.clarificationNeeded,
      actions: [],
      usage: await getDailyUsage(userId),
    });
  }

  const actions = plan.actions ?? [];

  // ── 8. Per-action connection guard ─────────────────────────────────────────
  const guardedActions = actions.map((action) => {
    if ((action.type === "send_email" || action.type === "summarize_emails") && !connections.gmail) {
      return {
        type: action.type,
        status: "skipped" as const,
        summary: "Your Gmail account is not connected. Go to Settings to connect it.",
        error: "Gmail not connected",
      };
    }
    if (action.type === "create_calendar_event" && !connections.googlecalendar) {
      return {
        type: "create_calendar_event",
        status: "skipped" as const,
        summary: "Calendar access is required for this action. Go to Settings to connect Google Calendar.",
        error: "Google Calendar not connected",
      };
    }
    return null;
  });

  const executableActions = actions.filter((_, i) => guardedActions[i] === null);

  // ── 9. Execute ─────────────────────────────────────────────────────────────
  const executionResults =
    executableActions.length > 0 ? await executeActions(userId, executableActions) : [];

  // Merge preserving original order
  const mergedResults = (() => {
    let execPtr = 0;
    return actions.map((_, i) => {
      if (guardedActions[i] !== null) return guardedActions[i]!;
      return (
        executionResults[execPtr++] ?? {
          type: "unknown",
          status: "failed" as const,
          summary: "I couldn't complete that action right now. Please try again.",
        }
      );
    });
  })();

  // ── 10. Overall status ─────────────────────────────────────────────────────
  const hasSuccess = mergedResults.some((r) => r.status === "success");
  const hasFailed = mergedResults.some((r) => r.status === "failed");
  const overallStatus = hasSuccess && !hasFailed ? "success" : hasSuccess ? "partial" : "failed";

  // ── 11. Increment usage (only if actions were attempted) ───────────────────
  if (executableActions.length > 0) {
    await incrementUsage(userId);
  }

  // ── 12. Log (fire-and-forget) ──────────────────────────────────────────────
  prisma.agentLog
    .create({
      data: { userId, prompt, plan: plan as any, results: mergedResults as any, status: overallStatus },
    })
    .catch((e: unknown) => console.error("[/api/agent/run] Log error:", e));

  // ── 13. Return ─────────────────────────────────────────────────────────────
  const usage = await getDailyUsage(userId);
  return NextResponse.json({
    understood: plan.understood,
    clarificationNeeded: plan.clarificationNeeded,
    actions: mergedResults,
    usage,
  });
};
