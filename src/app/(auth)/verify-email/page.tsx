import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-medium tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We’ve sent you a verification link. Click the link to activate your
            account and continue to Orion.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          Didn’t receive it? Check spam or try signing up again.
        </div>

        <Link
          href="/signin"
          className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}
