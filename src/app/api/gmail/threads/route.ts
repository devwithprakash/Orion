import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import {
  parseFrom,
  displayName,
  getHeader,
  threadListQuerySchema,
  FOLDER_LABEL_MAP,
  type EnrichedThread,
} from "@/lib/email-utils";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/gmail/threads
 *
 * Fetches, enriches, and returns Gmail threads for the authenticated user.
 *
 * Query params:
 *  - limit       (1-50, default 25)
 *  - pageToken   cursor for next page
 *  - folder      "inbox" | "starred" | "sent" | "drafts" | "trash" | "all"
 *  - q           Gmail search query string
 *
 * Response: { threads, nextPageToken, count }
 */
export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  // ── Parse & validate query params ─────────────────────────────────────────
  const parsed = threadListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query parameters", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { limit, pageToken, folder, q } = parsed.data;

  try {
    // ── Step 1: Get thread list from Gmail ──────────────────────────────────
    const labelId = FOLDER_LABEL_MAP[folder];

    // Build Gmail query string
    let queryStr = q ?? "";
    if (folder === "starred") queryStr = `is:starred ${queryStr}`.trim();
    if (folder === "trash") queryStr = `in:trash ${queryStr}`.trim();

    const listParams: Record<string, unknown> = {
      maxResults: limit,
      ...(pageToken ? { pageToken } : {}),
      ...(labelId && folder !== "starred" && folder !== "trash"
        ? { labelIds: [labelId] }
        : {}),
      ...(queryStr ? { q: queryStr } : {}),
    };

    const rawList = await corsair
      .withTenant(tenantId)
      .gmail.api.threads.list(listParams);

    const nextPageToken: string | null = rawList?.nextPageToken ?? null;
    const allRefs: { id?: string }[] = rawList?.threads ?? [];
    const threadRefs = allRefs.filter((t): t is { id: string } => !!t.id);

    if (threadRefs.length === 0) {
      return NextResponse.json({ threads: [], nextPageToken: null, count: 0 });
    }

    // ── Step 2: Fetch full thread details in parallel ───────────────────────
    // Use format: "full" to bypass any corrupted cache stubs and guarantee payload headers.
    const settled = await Promise.allSettled(
      threadRefs.map(({ id: threadId }) =>
        corsair.withTenant(tenantId).gmail.api.threads.get({
          id: threadId,
          format: "full",
        })
      )
    );

    // ── Step 3: Enrich each thread ──────────────────────────────────────────
    const threads: EnrichedThread[] = settled
      .map((result, i) => {
        if (result.status === "rejected" || !result.value) return null;

        const thread = result.value;
        const threadId = threadRefs[i].id;
        const messages: any[] = thread?.messages ?? [];
        if (messages.length === 0) return null;

        const isSent = folder === "sent";
        const latestMsg = messages[messages.length - 1];

        // Find the most appropriate message for headers
        // For sent folder: start from the end (latest message we sent)
        // For inbox: start from the end (latest incoming message)
        let msgHeaders: { name?: string; value?: string }[] = [];
        for (let j = messages.length - 1; j >= 0; j--) {
          const hdrs = messages[j]?.payload?.headers;
          if (hdrs && hdrs.length > 0) {
            msgHeaders = hdrs;
            // In inbox, we ideally want the last message that is NOT from us, but
            // for simplicity, the last message with headers usually works.
            break;
          }
        }

        // Fallback to the first message if we couldn't find headers searching backwards
        if (msgHeaders.length === 0) {
           msgHeaders = messages[0]?.payload?.headers ?? [];
        }

        const fromRaw = getHeader(msgHeaders, isSent ? "To" : "From");
        const { name: fromName, email: fromEmail } = parseFrom(fromRaw);
        const subject = getHeader(msgHeaders, "Subject");
        const dateRaw = getHeader(msgHeaders, "Date");

        const labelIds: string[] = latestMsg?.labelIds ?? [];
        const isUnread = labelIds.includes("UNREAD");
        const isStarred = labelIds.includes("STARRED");
        const isInInbox = labelIds.includes("INBOX");

        const internalDate = latestMsg?.internalDate
          ? new Date(Number(latestMsg.internalDate))
          : dateRaw
            ? new Date(dateRaw)
            : new Date();

        const snippet = thread.snippet ?? latestMsg?.snippet ?? "";

        return {
          id: threadId,
          messageCount: messages.length,
          from: displayName(fromName, fromEmail),
          fromEmail,
          subject: subject || null,
          snippet,
          date: internalDate.toISOString(),
          unread: isUnread,
          starred: isStarred,
          inInbox: isInInbox,
          labelIds,
        } satisfies EnrichedThread;
      })
      .filter((t): t is EnrichedThread => t !== null);

    return NextResponse.json({ threads, nextPageToken, count: threads.length });
  } catch (error: any) {
    console.error("[/api/gmail/threads GET] Error:", error);

    // Surface auth/permission errors distinctly
    const status =
      error?.status === 401 || error?.status === 403 ? error.status : 500;

    return NextResponse.json(
      { message: "Failed to fetch threads", error: String(error) },
      { status }
    );
  }
};
