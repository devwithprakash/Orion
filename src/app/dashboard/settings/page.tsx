import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AlreadyConnectedBanner } from "@/components/dashboard/already-connected-banner";
import { SettingsIntegrationCard } from "@/components/dashboard/settings-integration-card";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; service?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const params = await searchParams;
  const alreadyConnectedService =
    params.error === "already_connected" ? params.service : undefined;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-10">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your connected services and integrations.
          </p>
        </div>

        {/* Error banner */}
        {alreadyConnectedService && (
          <AlreadyConnectedBanner service={alreadyConnectedService} />
        )}

        {/* Integrations */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Connected Accounts
            </h2>
          </div>

          <div className="space-y-3">
            <SettingsIntegrationCard service="gmail" />
            <SettingsIntegrationCard service="googlecalendar" />
          </div>
        </section>

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground text-center pb-4">
          Orion uses read/write access to Gmail and Google Calendar to perform actions on your behalf.
          Disconnect any service at any time.
        </p>
      </div>
    </div>
  );
}
