import { corsair } from "@/server/corsair";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const res = await corsair.withTenant("orion").gmail.db.threads.list();

  console.log(res);
  return NextResponse.json({ data: res });
}
