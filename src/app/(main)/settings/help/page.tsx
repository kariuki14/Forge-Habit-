import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@forge.app";

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Help & Support
        </h1>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
        <div className="px-4 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Need help with something? We're here to assist you. Reach out to us and we'll respond as soon as we can.
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 px-4 py-4">
          <Mail size={18} className="text-slate-500 dark:text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email Us</p>
            <a
              href={`mailto:${supportEmail}`}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {supportEmail}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 px-4 py-4">
          <MessageCircle size={18} className="text-slate-500 dark:text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Response Time</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Within 24 hours</p>
          </div>
        </div>
      </section>

      <a
        href={`mailto:${supportEmail}?subject=Forge Support Request`}
        className="block w-full rounded-2xl bg-forest py-3.5 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-forest-deep"
      >
        Contact Support
      </a>
    </div>
  );
}
