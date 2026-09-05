import type { Metadata, Viewport } from "next";
import Script from "next/script";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9faf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "Forge — Build habits that stick",
  description: "Habit tracking, North Star goals and consistency insights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Forge",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
