import { auth } from "@/lib/auth";
import { disconnectConnection, ServiceType } from "@/lib/connection";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { service } = await req.json() as { service: ServiceType };

    if (!service || (service !== "gmail" && service !== "googlecalendar")) {
      return NextResponse.json({ message: "Invalid service type" }, { status: 400 });
    }

    const success = await disconnectConnection(session.user.id, service);

    if (!success) {
      return NextResponse.json({ message: "Connection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/connection/disconnect POST] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
};
