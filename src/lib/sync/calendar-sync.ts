import { corsair } from "@/lib/corsair";
import { prisma } from "@/lib/db";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

// ─── Sync State Helpers ────────────────────────────────────────────────────

export async function getCalendarSyncState(tenantId: string) {
  return prisma.syncState.findUnique({
    where: { tenantId_service: { tenantId, service: "googlecalendar" } },
  });
}

export async function upsertCalendarSyncState(
  tenantId: string,
  patch: {
    status?: SyncStatus;
    lastSyncAt?: Date;
    syncToken?: string | null;
    errorMessage?: string | null;
    retryCount?: number;
  },
) {
  return prisma.syncState.upsert({
    where: { tenantId_service: { tenantId, service: "googlecalendar" } },
    create: {
      tenantId,
      service: "googlecalendar",
      status: patch.status ?? "pending",
      lastSyncAt: patch.lastSyncAt,
      syncToken: patch.syncToken,
      errorMessage: patch.errorMessage,
      retryCount: patch.retryCount ?? 0,
    },
    update: {
      ...patch,
      updatedAt: new Date(),
    },
  });
}

// ─── Cache-First Event Fetcher ─────────────────────────────────────────────

/**
 * Cache-first calendar events:
 * 1. Try corsair.googlecalendar.db (reads from corsair_entities)
 * 2. If empty → fetch from API (hits Google + auto-caches)
 */
export async function fetchAndCacheCalendarEvents(
  tenantId: string,
  limit = 50,
): Promise<{ events: unknown[]; source: "cache" | "api" }> {
  try {
    // Step 1: Try Corsair's local DB cache (corsair_entities)
    const cached = await corsair
      .withTenant(tenantId)
      .googlecalendar.db.events.list({ limit });

    if (cached && cached.length > 0) {
      return { events: cached, source: "cache" };
    }

    // Step 2: Cache miss — fetch from Google Calendar API
    console.log(
      `[calendar-sync] Cache miss for tenant ${tenantId} — fetching from API`,
    );

    await upsertCalendarSyncState(tenantId, { status: "syncing" });

    const response = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.getMany({
        calendarId: "primary",
        maxResults: limit,
        singleEvents: true,
        orderBy: "startTime",
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // last 7 days
      });

    // ✅ Fix 1: getMany returns EventListResponse, not an array — extract .items
    const fresh = response?.items ?? [];

    await upsertCalendarSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
    });

    return { events: fresh, source: "api" };
  } catch (error) {
    console.error(`[calendar-sync] fetchAndCacheCalendarEvents failed:`, error);

    const state = await getCalendarSyncState(tenantId);
    const retryCount = (state?.retryCount ?? 0) + 1;

    await upsertCalendarSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      retryCount,
    });

    throw error;
  }
}

// ─── Initial Full Sync ─────────────────────────────────────────────────────

/**
 * Called once right after a user connects Google Calendar via OAuth.
 * Fetches initial events; Corsair auto-caches in corsair_entities.
 * Stores lastSyncAt for subsequent incremental syncs via updatedMin.
 */
export async function triggerInitialCalendarSync(
  tenantId: string,
): Promise<void> {
  console.log(`[calendar-sync] Starting initial sync for tenant ${tenantId}`);

  await upsertCalendarSyncState(tenantId, { status: "syncing" });

  try {
    // Fetch events — Corsair auto-saves to corsair_entities
    const response = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.getMany({
        calendarId: "primary",
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // last 30 days
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // next 90 days
      });

    const events = response?.items ?? [];

    console.log(
      `[calendar-sync] Initial sync complete. Events fetched: ${events.length}`,
    );

    await upsertCalendarSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
      syncToken: null, // not used; incremental sync uses updatedMin from lastSyncAt
      errorMessage: null,
      retryCount: 0,
    });
  } catch (error) {
    console.error(
      `[calendar-sync] Initial sync failed for tenant ${tenantId}:`,
      error,
    );

    await upsertCalendarSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Non-blocking — don't rethrow
  }
}

// ─── Incremental Sync ──────────────────────────────────────────────────────

/**
 * Delta sync using updatedMin (set to lastSyncAt). Only fetches events
 * modified since the last sync. Falls back to full sync if no lastSyncAt.
 *
 * Note: syncToken is not supported by the corsair getMany params — we use
 * updatedMin instead, which is the supported incremental filter.
 */
export async function triggerIncrementalCalendarSync(
  tenantId: string,
): Promise<void> {
  const state = await getCalendarSyncState(tenantId);

  if (!state?.lastSyncAt) {
    console.log(
      `[calendar-sync] No lastSyncAt for ${tenantId}, running full sync`,
    );
    return triggerInitialCalendarSync(tenantId);
  }

  console.log(`[calendar-sync] Incremental sync for tenant ${tenantId}`);

  await upsertCalendarSyncState(tenantId, { status: "syncing" });

  try {
    // ✅ Fix 2: use updatedMin (supported param) instead of syncToken (not supported)
    const response = await corsair
      .withTenant(tenantId)
      .googlecalendar.api.events.getMany({
        calendarId: "primary",
        updatedMin: state.lastSyncAt.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

    const updatedEvents = response?.items ?? [];

    console.log(
      `[calendar-sync] Incremental sync complete. Changes: ${updatedEvents.length}`,
    );

    await upsertCalendarSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
      errorMessage: null,
    });
  } catch (error: any) {
    console.error(`[calendar-sync] Incremental sync failed:`, error);

    await upsertCalendarSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

// ─── Calendar Watch (Webhook Push Notifications) ───────────────────────────

/**
 * Push notifications via events.watch are not available on this corsair
 * binding (only create/get/getMany/update/delete are exposed).
 *
 * Incremental sync via triggerIncrementalCalendarSync (polling or cron)
 * is the supported alternative — call it on a schedule or after mutations.
 */
