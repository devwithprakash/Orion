import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { z } from "zod";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const starSchema = z.object({
  starred: z.boolean(),
});

/**
 * POST /api/gmail/threads/[id]/star
 * Body: { starred: boolean }
 * Adds or removes the STARRED label on all messages in the thread.
 */
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: threadId } = await params;
  const tenantId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = starSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { starred } = parsed.data;

  try {
    // Fetch thread to get all message IDs
    const thread = await corsair
      .withTenant(tenantId)
      .gmail.api.threads.get({ id: threadId, format: "minimal" });

    const messageIds: string[] = (thread?.messages ?? []).map((m: any) => m.id);

    // Apply label modification to every message in the thread
    await Promise.allSettled(
      messageIds.map((msgId) =>
        corsair.withTenant(tenantId).gmail.api.messages.modify({
          id: msgId,
          addLabelIds: starred ? ["STARRED"] : [],
          removeLabelIds: starred ? [] : ["STARRED"],
        })
      )
    );

    return NextResponse.json({ success: true, starred });
  } catch (error) {
    console.error(`[/api/gmail/threads/${threadId}/star] Error:`, error);
    return NextResponse.json(
      { message: "Failed to update star", error: String(error) },
      { status: 500 }
    );
  }
};
