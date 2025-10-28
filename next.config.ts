// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// ⚙️ Configuration du plugin PWA
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",

  runtimeCaching: [
    // 🚫 Ne jamais mettre en cache les exports chiffrés (.pen.json)
    {
      urlPattern: /\/.*\.pen\.json$/i,
      handler: "NetworkOnly",
      method: "GET",
    },

    // 🖼️ Images du dossier public
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },

    // 📦 Fichiers Next.js (JS, CSS, etc.)
    {
      urlPattern: /^https?.*\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },

    // 💅 Fonts
    {
      urlPattern: /^https?.*\.(woff2?|ttf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },

    // 🧠 Pages HTML & API
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

// ✅ Configuration Next.js
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// 📦 Export combiné
export default withPWA(nextConfig);
