import { corsair } from "./src/lib/corsair";
import { prisma } from "./src/lib/db";

async function main() {
  const session = await prisma.session.findFirst({ include: { user: true } });
  if (!session) {
    console.log("No session found");
    return;
  }
  const tenantId = session.userId;
  
  const rawList = await corsair.withTenant(tenantId).gmail.api.threads.list({ maxResults: 1 });
  const threadId = rawList?.threads?.[0]?.id;
  if (!threadId) return;

  const t1 = await corsair.withTenant(tenantId).gmail.api.threads.get({ id: threadId, format: "metadata" });
  console.log("Format metadata:", JSON.stringify(t1?.messages?.[0]?.payload?.headers, null, 2));
  
  const t2 = await corsair.withTenant(tenantId).gmail.api.threads.get({ id: threadId, format: "full" });
  console.log("Format full:", JSON.stringify(t2?.messages?.[0]?.payload?.headers, null, 2));
}
main().catch(console.error);
