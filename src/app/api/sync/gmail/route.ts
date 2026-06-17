import { auth } from "@/lib/auth";
import {
  getGmailSyncState,
  triggerIncrementalGmailSync,
  triggerInitialGmailSync,
} from "@/lib/sync/gmail-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sync/gmail
 *
 * Manually triggers a Gmail sync for the authenticated user.
 * - If no historyId stored → full sync
 * - Otherwise → incremental delta sync using historyId
 *
 * GET /api/sync/gmail
 *
 * Returns the current sync state for the tenant.
 */
export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const state = await getGmailSyncState(session.user.id);

  return NextResponse.json({
    service: "gmail",
    status: state?.status ?? "not_started",
    lastSyncAt: state?.lastSyncAt ?? null,
    historyId: state?.historyId ?? null,
    retryCount: state?.retryCount ?? 0,
    errorMessage: state?.errorMessage ?? null,
  });
};

export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  try {
    const state = await getGmailSyncState(tenantId);

    // Block concurrent syncs
    if (state?.status === "syncing") {
      return NextResponse.json({ message: "Sync already in progress" }, { status: 409 });
    }

    // Check retry limit
    if ((state?.retryCount ?? 0) >= 5) {
      return NextResponse.json(
        { message: "Max retries exceeded. Please reconnect your Gmail account." },
        { status: 429 },
      );
    }

    // Fire sync in background — respond immediately
    if (state?.historyId) {
      triggerIncrementalGmailSync(tenantId).catch((e) =>
        console.error("[/api/sync/gmail] Incremental sync error:", e),
      );
      return NextResponse.json({ message: "Incremental Gmail sync started" });
    } else {
      triggerInitialGmailSync(tenantId).catch((e) =>
        console.error("[/api/sync/gmail] Full sync error:", e),
      );
      return NextResponse.json({ message: "Full Gmail sync started" });
    }
  } catch (error) {
    console.error("[/api/sync/gmail] Error:", error);
    return NextResponse.json(
      { message: "Failed to trigger sync", error: String(error) },
      { status: 500 },
    );
  }
};
