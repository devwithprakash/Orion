import { corsair } from "@/lib/corsair";
import {
  AgentAction,
  ActionResult,
  SendEmailAction,
  CreateCalendarEventAction,
} from "./schemas";

// ─── Email Executor ───────────────────────────────────────────────────────────

async function executeSendEmail(
  tenantId: string,
  action: SendEmailAction
): Promise<ActionResult> {
  try {
    const emailLines = [
      `To: ${action.to}`,
      action.cc ? `Cc: ${action.cc}` : null,
      action.bcc ? `Bcc: ${action.bcc}` : null,
      `Subject: ${action.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      action.body,
    ]
      .filter(Boolean)
      .join("\r\n");

    const raw = Buffer.from(emailLines)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sent = await corsair
      .withTenant(tenantId)
      .gmail.api.messages.send({ raw });

    return {
      type: "send_email",
      status: "success",
      summary: `Email sent to ${action.to} — "${action.subject}" (messageId: ${sent?.id ?? "?"})`,
    };
  } catch (error) {
    return {
      type: "send_email",
      status: "failed",
      summary: `Failed to send email to ${action.to}`,
      error: String(error),
    };
  }
}

// ─── Calendar Executor ────────────────────────────────────────────────────────

async function executeCreateCalendarEvent(
  tenantId: string,
  action: CreateCalendarEventAction
): Promise<ActionResult> {
  try {
    // Default end time = start + 1 hour
    const computeEndTime = (startTime: string): string => {
      const [h, m] = startTime.split(":").map(Number);
      const endH = (h + 1) % 24;
      return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const endTime = action.endTime ?? computeEndTime(action.startTime);
    const startDateTime = `${action.date}T${action.startTime}:00`;
    const endDateTime = `${action.date}T${endTime}:00`;
    const timeZone = action.timeZone ?? "UTC";

    const event = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.create({
        calendarId: "primary",
        event: {
          summary: action.title,
          description: action.notes ?? "",
          start: { dateTime: startDateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
          attendees: (action.attendees ?? []).map((email: string) => ({ email })),
        },
      });

    const attendeeStr =
      (action.attendees ?? []).length > 0
        ? ` with ${action.attendees!.join(", ")}`
        : "";

    return {
      type: "create_calendar_event",
      status: "success",
      summary: `Calendar event "${action.title}" created on ${action.date} at ${action.startTime}–${endTime}${attendeeStr}`,
    };
  } catch (error) {
    return {
      type: "create_calendar_event",
      status: "failed",
      summary: `Failed to create calendar event "${action.title}"`,
      error: String(error),
    };
  }
}

// ─── Main Executor ────────────────────────────────────────────────────────────

/**
 * Execute all actions from an AgentPlan sequentially.
 * Returns per-action results regardless of individual failures.
 */
export async function executeActions(
  tenantId: string,
  actions: AgentAction[]
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    if (action.type === "send_email") {
      results.push(await executeSendEmail(tenantId, action));
    } else if (action.type === "create_calendar_event") {
      results.push(await executeCreateCalendarEvent(tenantId, action));
    } else {
      results.push({
        type: (action as any).type ?? "unknown",
        status: "failed",
        summary: "Unknown action type — skipped",
        error: "Unsupported action",
      });
    }
  }

  return results;
}
