import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ConnectGoogleCard } from "@/components/dashboard/connect-google-card";
import { User, Settings, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-6 md:p-10 space-y-10">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="size-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account details and integration connections.
          </p>
        </div>

        {/* User Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="size-5 text-primary" />
            Account Information
          </h2>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1 text-base font-medium">{session.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1 text-base font-medium">{session.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="mt-1 text-xs font-mono text-muted-foreground truncate">{session.user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1 flex items-center gap-1.5">
                  <Shield className="size-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg
              className="size-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            Integrations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl pb-6 shadow-sm overflow-hidden flex flex-col justify-start">
              <ConnectGoogleCard service="gmail" />
            </div>
            <div className="bg-card border border-border rounded-xl pb-6 shadow-sm overflow-hidden flex flex-col justify-start">
              <ConnectGoogleCard service="googlecalendar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
