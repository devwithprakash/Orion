"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        console.log(error)
        toast.error(error.message);
        return;
      }

      toast.success("Reset link sent to your email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-7">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            Forgot password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        {/* Card form */}
        <form onSubmit={handleReset} className="space-y-3.5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                type="email"
                placeholder="you@corsair.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full h-11 pl-9 pr-3
                  rounded-lg border border-border
                  bg-background
                  text-sm
                  outline-none
                  focus:ring-2 focus:ring-primary/20
                "
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full h-11
              rounded-lg
              bg-primary
              text-primary-foreground
              text-sm font-medium
              disabled:opacity-50
              transition
            "
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {/* Back link */}
        <p className="text-sm text-center text-muted-foreground">
          Remember your password?{" "}
          <Link href="/signin" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
