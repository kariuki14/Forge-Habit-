import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forge — Build habits that stick",
    short_name: "Forge",
    description: "Habit tracking, North Star goals and consistency insights.",
    start_url: "/today",
    display: "standalone",
    background_color: "#1a3c34",
    theme_color: "#1a3c34",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["productivity", "lifestyle", "utilities"],
    shortcuts: [
      {
        name: "Today's Habits",
        url: "/today",
        description: "View and log daily habits",
      },
      {
        name: "North Star Goals",
        url: "/goals",
        description: "Track long-term goals",
      },
    ],
  };
}
