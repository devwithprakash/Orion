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

  const t1 = await corsair.withTenant(tenantId).gmail.api.threads.get({ id: threadId, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] });
  console.log("Format metadata keys:", Object.keys(t1 || {}));
  console.log("Messages length:", t1?.messages?.length);
  console.log("First message keys:", Object.keys(t1?.messages?.[0] || {}));
  console.log("First message payload:", !!t1?.messages?.[0]?.payload);
  console.log("First message headers:", t1?.messages?.[0]?.payload?.headers);
}
main().catch(console.error);
