import { auth } from "@/lib/auth";
import {
  getCalendarSyncState,
  triggerIncrementalCalendarSync,
  triggerInitialCalendarSync,
} from "@/lib/sync/calendar-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sync/calendar
 *
 * Returns the current calendar sync state for the tenant.
 */
export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const state = await getCalendarSyncState(session.user.id);

  return NextResponse.json({
    service: "googlecalendar",
    status: state?.status ?? "not_started",
    lastSyncAt: state?.lastSyncAt ?? null,
    syncToken: state?.syncToken ? "[stored]" : null, // Don't expose raw token
    retryCount: state?.retryCount ?? 0,
    errorMessage: state?.errorMessage ?? null,
  });
};

/**
 * POST /api/sync/calendar
 *
 * Manually triggers a calendar sync.
 * - If no syncToken stored → full sync
 * - Otherwise → incremental delta sync using syncToken
 */
export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  try {
    const state = await getCalendarSyncState(tenantId);

    if (state?.status === "syncing") {
      return NextResponse.json({ message: "Sync already in progress" }, { status: 409 });
    }

    if ((state?.retryCount ?? 0) >= 5) {
      return NextResponse.json(
        { message: "Max retries exceeded. Please reconnect your Calendar account." },
        { status: 429 },
      );
    }

    if (state?.syncToken) {
      triggerIncrementalCalendarSync(tenantId).catch((e) =>
        console.error("[/api/sync/calendar] Incremental sync error:", e),
      );
      return NextResponse.json({ message: "Incremental Calendar sync started" });
    } else {
      triggerInitialCalendarSync(tenantId).catch((e) =>
        console.error("[/api/sync/calendar] Full sync error:", e),
      );
      return NextResponse.json({ message: "Full Calendar sync started" });
    }
  } catch (error) {
    console.error("[/api/sync/calendar] Error:", error);
    return NextResponse.json(
      { message: "Failed to trigger sync", error: String(error) },
      { status: 500 },
    );
  }
};
