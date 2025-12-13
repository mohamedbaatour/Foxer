/* eslint-disable no-restricted-globals */
importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

if (!self.workbox) {
  // Workbox failed to load; don't break install/activate
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
} else {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  });

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  workbox.routing.registerNavigationRoute(
    workbox.precaching.getCacheKeyForURL("/index.html")
  );
}
