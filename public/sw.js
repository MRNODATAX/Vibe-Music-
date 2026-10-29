/**
 * Vibe Music service worker
 * ---------------------------------------------------------------------------
 * Strategy:
 *  - App shell (navigation) → network first, cached shell as offline fallback.
 *  - Same-origin assets          → stale-while-revalidate, so repeat visits are
 *    instant while updates land in the background.
 *  - Everything else             → straight to the network.
 */

const VERSION = "vibe-music-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(SHELL).catch(() => undefined);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(VERSION);
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(VERSION);
          return (await cache.match("/index.html")) ?? (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    })(),
  );
});
