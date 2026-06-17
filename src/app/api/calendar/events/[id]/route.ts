import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { triggerIncrementalCalendarSync } from "@/lib/sync/calendar-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/calendar/events/[id]
 *
 * Updates an existing calendar event via Corsair.
 */
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const { id: eventId } = await params;
  const body = await req.json();
  const { title, date, start, end, notes } = body;

  try {
    const patch: Record<string, unknown> = {};
    if (title) patch.summary = title;
    if (notes !== undefined) patch.description = notes;
    if (date && start) patch.start = { dateTime: `${date}T${start}:00` };
    if (date && end) patch.end = { dateTime: `${date}T${end}:00` };

    const event = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.patch({
        calendarId: "primary",
        eventId,
        requestBody: patch,
      });

    triggerIncrementalCalendarSync(tenantId).catch((e) =>
      console.error("[calendar/events PUT] Background sync error:", e),
    );

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[/api/calendar/events PUT] Error:", error);
    return NextResponse.json(
      { message: "Failed to update event", error: String(error) },
      { status: 500 },
    );
  }
};

/**
 * DELETE /api/calendar/events/[id]
 *
 * Deletes a calendar event via Corsair.
 */
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const { id: eventId } = await params;

  try {
    await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.delete({
        calendarId: "primary",
        eventId,
      });

    triggerIncrementalCalendarSync(tenantId).catch((e) =>
      console.error("[calendar/events DELETE] Background sync error:", e),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/calendar/events DELETE] Error:", error);
    return NextResponse.json(
      { message: "Failed to delete event", error: String(error) },
      { status: 500 },
    );
  }
};
