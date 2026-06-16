import { setupCorsair } from "corsair";
import { corsair } from "./corsair";

export async function onUserSignup(userId: string) {
  await setupCorsair(corsair, { tenantId: userId });
  console.log(`Tenant provisioned for user: ${userId}`);
}
