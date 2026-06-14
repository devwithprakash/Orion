import { OrionLogo } from "@/components/landing/orion-logo";
import Link from "next/link";

export default function Login() {
  return <AuthShell mode="signin" />;
}

export function AuthShell({ mode }: { mode: "signin" | "signup" }) {
  const isLogin = mode === "signin";
  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-7">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <OrionLogo />
          <span className="font-semibold text-lg tracking-tight">Orion</span>
        </Link>

        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            {isLogin ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to continue to Orion."
              : "Connect Gmail and Calendar in minutes."}
          </p>
        </div>

        <button className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or{" "}
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-3.5">
          {!isLogin && (
            <Field label="Full name" type="text" placeholder="Ada Lovelace" />
          )}
          <Field label="Email" type="email" placeholder="you@corsair.dev" />
          <Field
            label="Password"
            type="password"
            placeholder="••••••••"
            rightLabel={
              isLogin ? (
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot?
                </a>
              ) : null
            }
          />
          <Link
            href="/dashboard/agent"
            className="w-full h-11 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            {isLogin ? "Sign in" : "Create account"}
          </Link>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          {isLogin ? "New to Orion? " : "Already have an account? "}
          <Link
            href={isLogin ? "/signup" : "/signin"}
            className="text-foreground hover:underline"
          >
            {isLogin ? "Create account" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  rightLabel,
}: {
  label: string;
  type: string;
  placeholder: string;
  rightLabel?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {rightLabel}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.97 6.97 0 015.46 12c0-.73.13-1.44.38-2.1V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
