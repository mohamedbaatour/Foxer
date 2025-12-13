const workboxBuild = require("workbox-build");

workboxBuild.injectManifest({
  swSrc: "public/sw-src.js",
  swDest: "build/sw.js",
  globDirectory: "build",
  globPatterns: ["**/*.{html,js,css,svg,png,ico,json,webp,avif,woff2}"],
}).then(() => console.log("✅ SW generated at build/sw.js"));
