import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import ThemeSync from "@/components/ThemeSync";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const settings = await prisma.userSettings.findUniqueOrThrow({
    where: { userId: user.id },
    select: { appearanceMode: true },
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <ThemeSync mode={settings.appearanceMode} />
      
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <main className="mx-auto max-w-5xl px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
