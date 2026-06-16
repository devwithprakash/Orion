import { corsair } from "@/lib/corsair";
import { resolveBaseURL, success, trim } from "better-auth";
import { processWebhook } from "corsair";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

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
    url.searchParams.get("tenantId") ||
    url.searchParams.get("tenant_id") ||
    undefined;

  const result = await processWebhook(corsair, headers, body, { tenantId });

  console.info("Plugin Processed", result.plugin, result.action);

  const responseHeaders = result.responseHeaders;
  const nextHeaders = new Headers();

  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, value);
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
