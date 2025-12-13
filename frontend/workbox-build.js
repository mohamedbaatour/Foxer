const workboxBuild = require("workbox-build");

workboxBuild.generateSW({
  globDirectory: "build",
  globPatterns: ["**/*.{html,js,css,svg,png,ico,json,webp,avif,woff2}"],
  swDest: "build/sw.js",
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,

  // SPA offline fallback
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/api\//],
}).then(() => console.log("✅ SW generated at build/sw.js"));
