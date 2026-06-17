import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Decodes a base64url-encoded string to a UTF-8 string.
 * Gmail encodes all email body parts in base64url.
 */
function decodeBase64Url(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Recursively extracts body parts from a Gmail message payload.
 * Returns { html, text } — prefers multipart/alternative > text/html > text/plain.
 */
function extractBody(
  payload: any,
): { html: string | null; text: string | null } {
  if (!payload) return { html: null, text: null };

  const mimeType: string = payload.mimeType ?? "";

  // Direct body — not multipart
  if (!mimeType.startsWith("multipart/")) {
    const data: string = payload.body?.data ?? "";
    const decoded = data ? decodeBase64Url(data) : "";
    if (mimeType === "text/html") return { html: decoded, text: null };
    if (mimeType === "text/plain") return { html: null, text: decoded };
    return { html: null, text: null };
  }

  // Multipart — recurse into parts
  const parts: any[] = payload.parts ?? [];
  let html: string | null = null;
  let text: string | null = null;

  for (const part of parts) {
    const subMime: string = part.mimeType ?? "";

    if (subMime === "text/html" && !html) {
      html = decodeBase64Url(part.body?.data ?? "");
    } else if (subMime === "text/plain" && !text) {
      text = decodeBase64Url(part.body?.data ?? "");
    } else if (subMime.startsWith("multipart/")) {
      const sub = extractBody(part);
      if (!html && sub.html) html = sub.html;
      if (!text && sub.text) text = sub.text;
    }
  }

  return { html, text };
}

function getHeader(
  hdrs: { name?: string; value?: string }[] | undefined,
  name: string,
): string {
  return (
    hdrs?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

/**
 * GET /api/gmail/thread/[id]
 *
 * Returns the full email thread with decoded HTML/plain body,
 * headers (From, To, Subject, Date, CC), and message metadata.
 *
 * Used by the email reader to render the actual email content.
 */
export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const { id: threadId } = await params;

  if (!threadId) {
    return NextResponse.json(
      { message: "Thread ID is required" },
      { status: 400 },
    );
  }

  try {
    // Fetch the full thread with complete message payloads
    const thread = await corsair
      .withTenant(tenantId)
      .gmail.api.threads.get({
        id: threadId,
        format: "full",
      });

    if (!thread) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 },
      );
    }

    const messages: any[] = thread.messages ?? [];

    // Process each message in the thread
    const processedMessages = messages.map((msg: any) => {
      const msgHeaders: { name?: string; value?: string }[] =
        msg.payload?.headers ?? [];

      const from = getHeader(msgHeaders, "From");
      const to = getHeader(msgHeaders, "To");
      const cc = getHeader(msgHeaders, "Cc");
      const subject = getHeader(msgHeaders, "Subject");
      const date = getHeader(msgHeaders, "Date");

      const { html, text } = extractBody(msg.payload);

      const labelIds: string[] = msg.labelIds ?? [];
      const isUnread = labelIds.includes("UNREAD");

      const internalDate = msg.internalDate
        ? new Date(Number(msg.internalDate)).toISOString()
        : date;

      return {
        id: msg.id,
        threadId: msg.threadId,
        labelIds,
        isUnread,
        snippet: msg.snippet ?? "",
        internalDate,
        headers: { from, to, cc, subject, date },
        body: { html: html || null, text: text || null },
      };
    });

    return NextResponse.json({
      id: threadId,
      messages: processedMessages,
      messageCount: processedMessages.length,
    });
  } catch (error) {
    console.error(`[/api/gmail/thread/${threadId}] Error:`, error);
    return NextResponse.json(
      { message: "Failed to fetch thread", error: String(error) },
      { status: 500 },
    );
  }
};
