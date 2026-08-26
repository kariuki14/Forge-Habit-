"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Mail, Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { OAuthButtons } from "@/components/OAuthButtons";

type Step = "form" | "otp";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register-specific state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  const COPY = {
    login: {
      heading: "Welcome back",
      subtext: "The forge missed you.",
      submit: "Log In",
      pending: "Logging in...",
      footerText: "New here?",
      footerLink: "/register",
      footerLabel: "Create an account",
    },
    register: {
      heading: "Forge your best self",
      subtext: "Track habits, keep streaks alive, hit your North Star.",
      submit: "Get Started",
      pending: "Creating account...",
      footerText: "Already have an account?",
      footerLink: "/login",
      footerLabel: "Log in",
    },
  } as const;

  const copy = COPY[mode];

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login failed");
      window.location.href = "/today";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: data.get("password"),
          fullName: data.get("fullName"),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Signup failed");

      // Account created, move to OTP verification
      setOtpEmail(email);
      setStep("otp");
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail,
          otp: data.get("otp"),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Verification failed");
      window.location.href = "/today";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (otpResendTimer > 0) return;
    setError(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to resend code");
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function startResendTimer() {
    setOtpResendTimer(60);
    const interval = setInterval(() => {
      setOtpResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // OTP verification step
  if (step === "otp") {
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
            <strong className="text-slate-700 dark:text-slate-200">{otpEmail}</strong>
          </p>
        </div>

        <form
          onSubmit={handleOtpSubmit}
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
            disabled={loading}
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
              onClick={handleResendOtp}
              disabled={otpResendTimer > 0}
              className="font-semibold text-emerald-700 hover:underline disabled:text-slate-400 disabled:hover:no-underline"
            >
              {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : "Resend"}
            </button>
          </p>

          <p className="text-center text-xs text-slate-400">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
                setLoading(false);
              }}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
            >
              <ArrowLeft size={12} />
              Back to sign up
            </button>
          </p>
        </form>
      </main>
    );
  }

  // Login / Register form
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-lime-300">
          <Flame size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{copy.heading}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy.subtext}</p>
      </div>

      <form
        onSubmit={mode === "login" ? handleLoginSubmit : handleRegisterSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
      >
        {mode === "register" && (
          <div>
            <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              maxLength={120}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={mode === "register" ? "jane@example.com" : undefined}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            placeholder={mode === "register" ? "At least 8 characters" : undefined}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
          />
        </div>

        {mode === "login" && (
          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-emerald-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-forest-deep disabled:opacity-60"
        >
          {loading ? copy.pending : copy.submit}
        </button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <OAuthButtons />

        <p className="mt-1 text-center text-xs text-slate-400">
          {copy.footerText}{" "}
          <Link href={copy.footerLink} className="font-semibold text-emerald-700 hover:underline">
            {copy.footerLabel}
          </Link>
        </p>
      </form>
    </main>
  );
}
