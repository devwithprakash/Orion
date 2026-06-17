import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { fetchAndCacheGmailThreads } from "@/lib/sync/gmail-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function getHeader(
  hdrs: { name?: string; value?: string }[] | undefined,
  name: string,
): string {
  return (
    hdrs?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

/**
 * GET /api/gmail/threads
 *
 * Cache-first strategy:
 * 1. Check Corsair's corsair_entities cache (gmail.db.threads.list)
 * 2. If empty → fetch from Google API via Corsair (gmail.api.threads.list)
 * 3. Enrich each thread with From/Subject by fetching messages.list per thread
 * 4. Return enriched threads with source metadata
 */
export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 50);

  try {
    const { threads, source } = await fetchAndCacheGmailThreads(
      tenantId,
      limit,
    );

    // Enrich each thread with From/Subject by fetching its messages
    const enriched = await Promise.all(
      (threads as any[]).map(async (thread) => {
        const threadId = thread.entity_id ?? thread.data?.id;
        if (!threadId) return { ...thread, from: null, subject: null };

        try {
          const result = await corsair
            .withTenant(tenantId)
            .gmail.api.messages.list({
              q: `in:anywhere`,
              maxResults: 1,
              // filter to this thread
              ...(threadId ? { q: `thread:${threadId}` } : {}),
            });

          const messageId = result?.messages?.[0]?.id;
          if (!messageId) return { ...thread, from: null, subject: null };

          const message = await corsair
            .withTenant(tenantId)
            .gmail.api.messages.get({
              id: messageId,
              format: "full",
              metadataHeaders: ["From", "Subject", "Date"],
            });

          const msgHeaders = message?.payload?.headers ?? [];

          const fromRaw = getHeader(msgHeaders, "From");
          const emailMatch = fromRaw.match(/<(.+?)>/);
          const nameMatch = fromRaw.match(/^(.+?)\s*</);

          return {
            ...thread,
            from: nameMatch?.[1]?.trim() || fromRaw || null,
            fromEmail: emailMatch?.[1]?.trim() || fromRaw || null,
            subject: getHeader(msgHeaders, "Subject") || null,
            date: getHeader(msgHeaders, "Date") || null,
          };
        } catch {
          return { ...thread, from: null, subject: null };
        }
      }),
    );

    return NextResponse.json({
      threads: enriched,
      source,
      count: enriched.length,
    });
  } catch (error) {
    console.error("[/api/gmail/threads] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch threads", error: String(error) },
      { status: 500 },
    );
  }
};
