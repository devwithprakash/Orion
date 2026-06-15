"use client";

import Link from "next/link";
import { useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully");
      redirect("/signin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            Reset password
          </h1>

          <p className="text-sm text-muted-foreground">
            Choose a new password for your Orion account.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-3.5">
          <div className="space-y-2">
            <label className="text-sm font-medium">New password</label>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              transition-colors
            "
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

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
