const workboxBuild = require("workbox-build");

workboxBuild.generateSW({
  globDirectory: "build",
  globPatterns: [
    "**/*.{html,js,css,svg,png,ico,json}"
  ],
  swDest: "build/sw.js",
  skipWaiting: true,
  clientsClaim: true,
}).then(() => {
  console.log("Service worker generated!");
});
    