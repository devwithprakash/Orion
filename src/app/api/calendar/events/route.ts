import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import {
  fetchAndCacheCalendarEvents,
  triggerIncrementalCalendarSync,
} from "@/lib/sync/calendar-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/calendar/events
 *
 * Cache-first strategy for calendar events.
 */
export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  try {
    const { events, source } = await fetchAndCacheCalendarEvents(
      tenantId,
      limit,
    );
    return NextResponse.json({ events, source, count: events.length });
  } catch (error) {
    console.error("[/api/calendar/events GET] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch events", error: String(error) },
      { status: 500 },
    );
  }
};

/**
 * POST /api/calendar/events
 *
 * Creates a new calendar event via Corsair, then triggers incremental sync.
 */
export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const body = await req.json();
  const { title, date, start, end, notes, attendees } = body;

  if (!title || !date || !start || !end) {
    return NextResponse.json(
      { message: "Missing required fields: title, date, start, end" },
      { status: 400 },
    );
  }

  try {
    const startDateTime = `${date}T${start}:00`;
    const endDateTime = `${date}T${end}:00`;

    const event = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.create({
        calendarId: "primary",
        event: {
          summary: title,
          description: notes ?? "",
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime },
          attendees: attendees
            ? attendees.map((email: string) => ({ email }))
            : [],
        },
      });

    // Background incremental sync
    triggerIncrementalCalendarSync(tenantId).catch((e) =>
      console.error("[calendar/events POST] Background sync error:", e),
    );

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[/api/calendar/events POST] Error:", error);
    return NextResponse.json(
      { message: "Failed to create event", error: String(error) },
      { status: 500 },
    );
  }
};
