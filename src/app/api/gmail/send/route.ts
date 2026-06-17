import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { triggerIncrementalGmailSync } from "@/lib/sync/gmail-sync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gmail/send
 *
 * Sends an email via Corsair's Gmail API on behalf of the authenticated tenant.
 * After sending, triggers an incremental sync to update the thread cache.
 */
export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  const body = await req.json();
  const { to, subject, message, cc, bcc, threadId } = body;

  if (!to || !subject || !message) {
    return NextResponse.json(
      { message: "Missing required fields: to, subject, message" },
      { status: 400 },
    );
  }

  try {
    // Build RFC 2822 raw email
    const emailLines = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      bcc ? `Bcc: ${bcc}` : null,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      message,
    ]
      .filter(Boolean)
      .join("\r\n");

    const raw = Buffer.from(emailLines)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sent = await corsair.withTenant(tenantId).gmail.api.messages.send({
      raw,
      ...(threadId ? { threadId } : {}),
    });

    // Trigger incremental sync to update thread cache
    triggerIncrementalGmailSync(tenantId).catch((e) =>
      console.error("[gmail/send] Background sync error:", e),
    );

    return NextResponse.json({ success: true, messageId: sent?.id });
  } catch (error) {
    console.error("[/api/gmail/send] Error:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: String(error) },
      { status: 500 },
    );
  }
};
