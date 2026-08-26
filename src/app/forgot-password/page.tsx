"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("idle");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-lime-300">
          <Flame size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {status === "sent" ? "Check your email" : "Reset your password"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {status === "sent"
            ? "If an account exists with that email, you will receive a reset link shortly."
            : "Enter your email and we will send you a reset link."}
        </p>
      </div>

      {status === "sent" ? (
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            A password reset link has been sent to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
            Check your inbox and follow the link.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
            {status === "loading" ? "Sending..." : "Send Reset Link"}
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
