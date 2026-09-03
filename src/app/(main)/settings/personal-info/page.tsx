import { getSessionUser } from "@/lib/session";
import { ArrowLeft, Mail, User, Calendar } from "lucide-react";
import Link from "next/link";

export default async function PersonalInfoPage() {
  const user = await getSessionUser();
  if (!user) return null;

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
          Personal Information
        </h1>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <User size={18} className="text-slate-500 dark:text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Full Name</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 px-4 py-4">
          <Mail size={18} className="text-slate-500 dark:text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email Address</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 px-4 py-4">
          <Calendar size={18} className="text-slate-500 dark:text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Member Since</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }) : "N/A"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
