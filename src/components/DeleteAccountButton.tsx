"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/auth";

export function DeleteAccountButton({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const password = hasPassword ? String(data.get("password") ?? "") : null;

    const result = await deleteAccountAction(password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    // Account gone — hard redirect so all client state resets.
    window.location.href = "/login";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-800 py-3.5 text-sm font-semibold text-red-500 dark:text-red-400 shadow-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 lg:max-w-xs flex items-center justify-center gap-2"
      >
        <Trash2 size={16} />
        Delete Account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleDelete}
            className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-500">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Delete your account?
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  This permanently erases your profile, habits, goals, streaks, and all
                  associated data from our servers. This cannot be undone.
                </p>
              </div>
            </div>

            {hasPassword && (
              <div className="mb-4">
                <label htmlFor="delete-password" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Confirm with your password
                </label>
                <input
                  id="delete-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-red-400"
                />
              </div>
            )}

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete forever"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
