import { prisma } from "@/lib/db";

export type ServiceType = "gmail" | "googlecalendar";

/**
 * Check which Google services are connected for a tenant.
 * Queries the corsair_accounts table (managed by Corsair) and maps
 * integrationId prefixes to service names.
 */
export async function getConnectionStatus(
  tenantId: string,
): Promise<{ gmail: boolean; googlecalendar: boolean }> {
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId },
    include: { integration: true },
  });

  const gmail = accounts.some(
    (a) =>
      a.integration.name.toLowerCase().includes("gmail") ||
      a.integrationId.toLowerCase().includes("gmail"),
  );

  const googlecalendar = accounts.some(
    (a) =>
      a.integration.name.toLowerCase().includes("calendar") ||
      a.integrationId.toLowerCase().includes("calendar"),
  );

  return { gmail, googlecalendar };
}

/**
 * Resolve a tenantId from an email address by looking up CorsairAccount
 * config. Used in webhook processing where we only have the user's email.
 */
export async function resolveTenantFromEmail(
  emailAddress: string,
): Promise<string | null> {
  // CorsairAccount stores account config as JSON — look for emailAddress field
  const accounts = await prisma.corsairAccount.findMany({
    where: {
      config: {
        path: ["emailAddress"],
        equals: emailAddress,
      },
    },
  });

  if (accounts.length > 0) return accounts[0].tenantId;

  // Fallback: search through all accounts' config for the email
  const allAccounts = await prisma.corsairAccount.findMany();
  for (const account of allAccounts) {
    const config = account.config as Record<string, unknown>;
    if (
      config.emailAddress === emailAddress ||
      config.email === emailAddress
    ) {
      return account.tenantId;
    }
  }

  return null;
}
