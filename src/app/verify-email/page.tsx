"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: data.get("otp") }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Verification failed");
      window.location.href = "/today";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  function startResendTimer() {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendTimer > 0 || !email) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to resend code");
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-lime-300">
          <Mail size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Verify your email
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to{" "}
          <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
      >
        <div>
          <label htmlFor="otp" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Verification Code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-center text-lg tracking-[0.3em] font-mono outline-none focus:border-lime-500"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email}
          className="mt-1 w-full rounded-xl bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-forest-deep disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className="font-semibold text-emerald-700 hover:underline disabled:text-slate-400 disabled:hover:no-underline"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
          </button>
        </p>

        <p className="text-center text-xs text-slate-400">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
            <ArrowLeft size={12} />
            Back to log in
          </Link>
        </p>
      </form>
    </main>
  );
}
