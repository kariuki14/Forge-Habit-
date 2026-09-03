"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame, Lock, ArrowLeft, CheckCircle } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("No reset token provided");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("idle");
    }
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-lime-300">
            <Flame size={24} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Invalid link</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This password reset link is invalid or missing a token.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm text-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ArrowLeft size={14} />
            Request a new reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-lime-300">
          <Flame size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {status === "done" ? "Password updated" : "Set new password"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {status === "done" ? "Your password has been reset successfully." : "Enter your new password below."}
        </p>
      </div>

      {status === "done" ? (
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ArrowLeft size={14} />
            Log in with your new password
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
        >
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              New Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-1 w-full rounded-xl bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-forest-deep disabled:opacity-60"
          >
            {status === "loading" ? "Resetting..." : "Reset Password"}
          </button>

          <p className="mt-1 text-center text-xs text-slate-400">
            <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
