import { Plug, PlugZap } from "lucide-react";

export function ConnectGmailCard() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <PlugZap className="h-6 w-6 text-primary" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight">
          Connect your Gmail account
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Connect your Gmail account to access emails
        </p>

        <button className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          <Plug size={16} />
          Connect Gmail
        </button>
      </div>
    </div>
  );
}
