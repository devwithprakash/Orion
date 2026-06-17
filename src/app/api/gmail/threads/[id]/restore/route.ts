import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gmail/threads/[id]/restore
 * Restores a thread from Trash by removing the TRASH label and adding INBOX.
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

  try {
    await corsair
      .withTenant(tenantId)
      .gmail.api.threads.untrash({ id: threadId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[/api/gmail/threads/${threadId}/restore] Error:`, error);
    return NextResponse.json(
      { message: "Failed to restore thread", error: String(error) },
      { status: 500 }
    );
  }
};
