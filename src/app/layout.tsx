import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forge — Build habits that stick",
  description: "Habit tracking, North Star goals and consistency insights.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className="font-sans bg-mist text-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-dvh antialiased"
        suppressHydrationWarning
      >
        {/*
          Next.js <Script strategy="beforeInteractive"> is the correct way to
          inject a blocking script in App Router. A raw <script> tag inside
          <head> is ignored during client-side navigation.
          The `id` prop is required for inline scripts.
        */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('forge-theme');if(s==='dark'||s==='light'){document.documentElement.classList.toggle('dark',s==='dark')}else{document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme: dark)').matches)}}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
