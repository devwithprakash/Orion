import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { sendEmailSchema } from "@/lib/email-utils";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gmail/send
 *
 * Sends an email via Gmail on behalf of the authenticated tenant.
 * Body: { to, subject, message, cc?, bcc?, threadId? }
 */
export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  // ── Validate request body ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { to, subject, message, cc, bcc, threadId } = parsed.data;

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

    const sent = await corsair
      .withTenant(tenantId)
      .gmail.api.messages.send({
        raw,
        ...(threadId ? { threadId } : {}),
      });

    console.log(`[/api/gmail/send] Sent messageId=${sent?.id} for tenant=${tenantId}`);

    return NextResponse.json({ success: true, messageId: sent?.id });
  } catch (error) {
    console.error("[/api/gmail/send] Error:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: String(error) },
      { status: 500 }
    );
  }
};
