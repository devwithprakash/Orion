import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConnectionStatus } from "@/lib/connection";
import { callOpenRouter } from "@/lib/agent/openrouter";
import { executeActions } from "@/lib/agent/executor";
import { checkDailyLimit, incrementUsage, getDailyUsage, DAILY_LIMIT } from "@/lib/agent/usage";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/agent/run
 *
 * Main entry point for the AI agent workflow.
 * Body: { prompt: string; timeZone?: string }
 */
export const POST = async (req: NextRequest) => {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // ── 2. Parse request body ──────────────────────────────────────────────────
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

  // ── 3. Daily usage limit check ─────────────────────────────────────────────
  const limitCheck = await checkDailyLimit(userId);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        message: `You have reached your daily AI limit of ${DAILY_LIMIT} actions. Please try again tomorrow.`,
        usage: {
          used: limitCheck.used,
          remaining: 0,
          limit: DAILY_LIMIT,
        },
      },
      { status: 429 }
    );
  }

  // ── 4. Check connection status for guard ───────────────────────────────────
  const connections = await getConnectionStatus(userId);

  // ── 5. Call OpenRouter — get structured plan ───────────────────────────────
  let plan;
  try {
    plan = await callOpenRouter(prompt, timeZone);
  } catch (error) {
    console.error("[/api/agent/run] OpenRouter error:", error);
    return NextResponse.json(
      { message: `AI service error: ${String(error)}` },
      { status: 502 }
    );
  }

  // ── 6. Handle clarification needed ────────────────────────────────────────
  if (plan.clarificationNeeded && plan.actions.length === 0) {
    return NextResponse.json({
      understood: plan.understood,
      clarificationNeeded: plan.clarificationNeeded,
      actions: [],
      usage: await getDailyUsage(userId),
    });
  }

  // ── 7. Guard per-action connection requirements ────────────────────────────
  const guardedActions = plan.actions.map((action) => {
    if (action.type === "send_email" && !connections.gmail) {
      return {
        type: "send_email",
        status: "skipped" as const,
        summary: "Gmail is not connected. Please connect Gmail in Settings to send emails.",
        error: "Gmail not connected",
      };
    }
    if (action.type === "create_calendar_event" && !connections.googlecalendar) {
      return {
        type: "create_calendar_event",
        status: "skipped" as const,
        summary: "Google Calendar is not connected. Please connect it in Settings.",
        error: "Google Calendar not connected",
      };
    }
    return null; // will be executed normally
  });

  const skippedResults = guardedActions.filter(Boolean) as Array<{
    type: string; status: "skipped"; summary: string; error: string;
  }>;
  const executableActions = plan.actions.filter((_, i) => guardedActions[i] === null);

  // ── 8. Execute actions ─────────────────────────────────────────────────────
  const executionResults = executableActions.length > 0
    ? await executeActions(userId, executableActions)
    : [];

  // Merge results preserving order
  const mergedResults = (() => {
    let execPtr = 0;
    return plan.actions.map((_, i) => {
      if (guardedActions[i] !== null) return guardedActions[i]!;
      return executionResults[execPtr++] ?? { type: "unknown", status: "failed" as const, summary: "Execution error" };
    });
  })();

  // ── 9. Determine overall status ────────────────────────────────────────────
  const hasSuccess = mergedResults.some((r) => r.status === "success");
  const hasFailed = mergedResults.some((r) => r.status === "failed");
  const overallStatus = hasSuccess && !hasFailed
    ? "success"
    : hasSuccess && hasFailed
    ? "partial"
    : "failed";

  // ── 10. Increment usage (only if at least one action was attempted) ─────────
  if (executableActions.length > 0) {
    await incrementUsage(userId);
  }

  // ── 11. Log the run ────────────────────────────────────────────────────────
  prisma.agentLog.create({
    data: {
      userId,
      prompt,
      plan: plan as any,
      results: mergedResults as any,
      status: overallStatus,
    },
  }).catch((e: unknown) => console.error("[/api/agent/run] Failed to write log:", e));

  // ── 12. Return result ──────────────────────────────────────────────────────
  const usage = await getDailyUsage(userId);

  return NextResponse.json({
    understood: plan.understood,
    clarificationNeeded: plan.clarificationNeeded,
    actions: mergedResults,
    usage,
  });
};
