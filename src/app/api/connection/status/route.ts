import { auth } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/connection";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const status = await getConnectionStatus(session.user.id);

  return NextResponse.json(status);
};
