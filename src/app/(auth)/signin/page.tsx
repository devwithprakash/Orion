"use client";

import { OrionLogo } from "@/components/landing/orion-logo";
import { signInSchema, signUpSchema } from "@/lib/validators/auth-validation";
import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { signIn, signUp } from "../../../../features/auth/actions/auth";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

type FieldProps = {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  rightLabel?: React.ReactNode;
  error?: string;
};

type AuthErrors = {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
};

export default function Login({ searchParams }: SignInPageProps) {
  return <AuthShell mode="signin" />;
}

export function AuthShell({ mode }: { mode: "signin" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();

  const isLogin = mode === "signin";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = signUpSchema.safeParse({
          name,
          email,
          password,
        });

        if (!result.success) {
          const fieldErrors: Record<string, string> = {};

          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;

            if (!fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          });

          setErrors(fieldErrors);

          return;
        }

        setErrors({});
        const { data, error } = await signUp(result.data);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Verification email sent. Check your inbox.");

        router.push("/verify-email");
      }

      if (mode === "signin") {
        const result = signInSchema.safeParse({
          email,
          password,
        });

        if (!result.success) {
          const fieldErrors: Record<string, string> = {};

          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;

            if (!fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          });

          setErrors(fieldErrors);
          return;
        }
        setErrors({});

        const { error } = await signIn(result.data);

        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Logged in successfully");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard/email",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

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

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or{" "}
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <Field
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              error={errors.name}
              placeholder="Ada Lovelace"
            />
          )}
          <Field
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@corsair.dev"
            error={errors.email}
          />
          <Field
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightLabel={
              isLogin ? (
                <a
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </a>
              ) : null
            }
            error={errors.password}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in"
                : "Create account"}
          </button>
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
  value,
  onChange,
  error,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {rightLabel}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-11 px-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                    ${
                      error
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-border"
                    }
          `}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
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
