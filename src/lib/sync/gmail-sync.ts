import { corsair } from "@/lib/corsair";
import { prisma } from "@/lib/db";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export async function getGmailSyncState(tenantId: string) {
  return prisma.syncState.findUnique({
    where: { tenantId_service: { tenantId, service: "gmail" } },
  });
}

export async function upsertGmailSyncState(
  tenantId: string,
  patch: {
    status?: SyncStatus;
    lastSyncAt?: Date;
    historyId?: string | null;
    errorMessage?: string | null;
    retryCount?: number;
  },
) {
  return prisma.syncState.upsert({
    where: { tenantId_service: { tenantId, service: "gmail" } },
    create: {
      tenantId,
      service: "gmail",
      status: patch.status ?? "pending",
      lastSyncAt: patch.lastSyncAt,
      historyId: patch.historyId,
      errorMessage: patch.errorMessage,
      retryCount: patch.retryCount ?? 0,
    },
    update: {
      ...patch,
      updatedAt: new Date(),
    },
  });
}

async function hydrateThreadDetails(
  tenantId: string,
  threadIds: string[],
): Promise<void> {
  if (threadIds.length === 0) return;

  await Promise.allSettled(
    threadIds.map((id) =>
      corsair.withTenant(tenantId).gmail.api.threads.get({
        id,
        format: "full",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      }),
    ),
  );
}

export async function fetchAndCacheGmailThreads(
  tenantId: string,
  limit = 50,
): Promise<{ threads: unknown[]; source: "cache" | "api" }> {
  try {
    const cached = await corsair
      .withTenant(tenantId)
      .gmail.db.threads.list({ limit });

    if (cached && cached.length > 0) {
      return { threads: cached, source: "cache" };
    }

    console.log(
      `[gmail-sync] Cache miss for tenant ${tenantId} — fetching from API`,
    );

    await upsertGmailSyncState(tenantId, { status: "syncing" });

    const response = await corsair
      .withTenant(tenantId)
      .gmail.api.threads.list({ maxResults: limit });

    const threads = response?.threads ?? [];

    const threadIds = threads.map((t: any) => t.id).filter(Boolean);
    await hydrateThreadDetails(tenantId, threadIds);

    await upsertGmailSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
    });

    const hydrated = await corsair
      .withTenant(tenantId)
      .gmail.db.threads.list({ limit });

    return { threads: hydrated ?? threads, source: "api" };
  } catch (error) {
    console.error(`[gmail-sync] fetchAndCacheGmailThreads failed:`, error);

    const state = await getGmailSyncState(tenantId);
    const retryCount = (state?.retryCount ?? 0) + 1;

    await upsertGmailSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      retryCount,
    });

    throw error;
  }
}

export async function triggerInitialGmailSync(tenantId: string): Promise<void> {
  console.log(`[gmail-sync] Starting initial sync for tenant ${tenantId}`);

  await upsertGmailSyncState(tenantId, { status: "syncing" });

  try {
    const response = await corsair
      .withTenant(tenantId)
      .gmail.api.threads.list({ maxResults: 50 });

    const threads = response?.threads ?? [];

    console.log(`[gmail-sync] Initial sync fetched ${threads.length} threads`);

    const threadIds = threads.map((t: any) => t.id).filter(Boolean);
    await hydrateThreadDetails(tenantId, threadIds);

    console.log(
      `[gmail-sync] Hydrated ${threadIds.length} threads with headers`,
    );

    await upsertGmailSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
      historyId: null,
      errorMessage: null,
      retryCount: 0,
    });
  } catch (error) {
    console.error(
      `[gmail-sync] Initial sync failed for tenant ${tenantId}:`,
      error,
    );

    await upsertGmailSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function triggerIncrementalGmailSync(
  tenantId: string,
): Promise<void> {
  const state = await getGmailSyncState(tenantId);

  if (!state?.lastSyncAt) {
    console.log(
      `[gmail-sync] No lastSyncAt for ${tenantId}, running full sync`,
    );
    return triggerInitialGmailSync(tenantId);
  }

  console.log(
    `[gmail-sync] Incremental sync since ${state.lastSyncAt.toISOString()}`,
  );

  await upsertGmailSyncState(tenantId, { status: "syncing" });

  try {
    const afterEpoch = Math.floor(state.lastSyncAt.getTime() / 1000);

    const newMessages = await corsair
      .withTenant(tenantId)
      .gmail.api.messages.list({
        q: `after:${afterEpoch}`,
        maxResults: 50,
      });

    const messages = newMessages?.messages ?? [];

    console.log(
      `[gmail-sync] Incremental sync found ${messages.length} new messages`,
    );

    if (messages.length > 0) {
      const response = await corsair
        .withTenant(tenantId)
        .gmail.api.threads.list({ maxResults: 50 });
      const threadIds = (response?.threads ?? [])
        .map((t: any) => t.id)
        .filter(Boolean);
      await hydrateThreadDetails(tenantId, threadIds);
    }

    await upsertGmailSyncState(tenantId, {
      status: "synced",
      lastSyncAt: new Date(),
      errorMessage: null,
    });
  } catch (error: any) {
    console.error(`[gmail-sync] Incremental sync failed:`, error);

    await upsertGmailSyncState(tenantId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
