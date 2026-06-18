import { prisma } from "./src/lib/db";

async function main() {
  const session = await prisma.session.findFirst({ include: { user: true } });
  if (!session) {
    console.log("No session found");
    return;
  }
  const tenantId = session.userId;
  
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId },
    include: { integration: true },
  });

  const accountToDelete = accounts.find((a) =>
    a.integration.name.toLowerCase().includes("gmail") ||
    a.integrationId.toLowerCase().includes("gmail")
  );

  if (!accountToDelete) {
    console.log("No gmail account found");
    return;
  }

  console.log("Account to delete:", accountToDelete.id);
  
  const entities = await prisma.corsairEntity.count({
    where: { accountId: accountToDelete.id },
  });
  console.log("Entities count:", entities);

  const events = await prisma.corsairEvent.count({
    where: { accountId: accountToDelete.id },
  });
  console.log("Events count:", events);

  try {
    await prisma.$transaction([
      prisma.corsairEntity.deleteMany({ where: { accountId: accountToDelete.id } }),
      prisma.corsairEvent.deleteMany({ where: { accountId: accountToDelete.id } }),
      prisma.corsairAccount.delete({ where: { id: accountToDelete.id } })
    ]);
    console.log("Transaction delete successful");
  } catch (e: any) {
    console.error("Transaction delete failed:", e.message);
  }
}

main().catch(console.error);
