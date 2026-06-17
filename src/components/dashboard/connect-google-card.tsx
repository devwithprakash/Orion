import { Plug, PlugZap, Calendar as CalendarIcon, Mail } from "lucide-react";

export function ConnectGoogleCard({ service }: { service: "gmail" | "googlecalendar" }) {
  const handleConnection = () => {
    window.location.href = `/api/corsair/connect?plugin=${service}`;
  };

  const isGmail = service === "gmail";

  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          {isGmail ? (
            <Mail className="h-6 w-6 text-primary" />
          ) : (
            <CalendarIcon className="h-6 w-6 text-primary" />
          )}
        </div>

        <h2 className="text-xl font-semibold tracking-tight">
          Connect your {isGmail ? "Gmail" : "Google Calendar"} account
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Connect your account to access {isGmail ? "emails" : "events"}
        </p>

        <button onClick={handleConnection} className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          <Plug size={16} />
          Connect {isGmail ? "Gmail" : "Calendar"}
        </button>
      </div>
    </div>
  );
}
