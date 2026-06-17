import { corsair } from "@/lib/corsair";
import { processWebhook } from "corsair";
import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantFromEmail } from "@/lib/connection";
import { triggerIncrementalGmailSync } from "@/lib/sync/gmail-sync";
import { triggerIncrementalCalendarSync } from "@/lib/sync/calendar-sync";

export async function POST(request: NextRequest) {
  console.log("Webhook triggered 🥳🥳🥳🥳🥳🥳🥳🥳");

  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => (headers[key] = value));

  const contentType = request.headers.get("content-type");

  let body: string | Record<string, unknown>;

  if (contentType?.includes("application/json")) {
    body = await request.json();
  } else {
    const text = await request.text();
    body = text && text.trim() ? text : {};
  }

  const tenantId =
    (body as any).emailAddress || (body as any).userEmail || undefined;

  let resolvedTenantId = tenantId;
  if (!resolvedTenantId && (body as any).emailAddress) {
    resolvedTenantId = await resolveTenantFromEmail((body as any).emailAddress);
  }

  const result = await processWebhook(corsair, headers, body, {
    tenantId: resolvedTenantId,
  });

  console.info("Plugin Processed", result.plugin, result.action);

  const responseHeaders = result.responseHeaders;
  const nextHeaders = new Headers();

  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, value);
    }
  }

  if (result.plugin === "gmail") {
    if (resolvedTenantId) {
      console.info(
        `Gmail event received: ${result.action} — triggering incremental sync`,
      );
      triggerIncrementalGmailSync(resolvedTenantId).catch(console.error);
    } else {
      console.warn(
        "Gmail webhook received but no tenantId resolved — skipping sync",
      );
    }
  }

  if (result.plugin === "googlecalendar") {
    if (resolvedTenantId) {
      triggerIncrementalCalendarSync(resolvedTenantId).catch(console.error);
    }
  }

  if (!result.response) {
    return NextResponse.json(
      {
        success: false,
        message: "No matching webhook handler found",
      },
      {
        status: 404,
      },
    );
  }

  if (result.responseHeaders !== undefined) {
    return NextResponse.json(result.response, { headers: nextHeaders });
  }

  return new NextResponse(null, { status: 200, headers: nextHeaders });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
