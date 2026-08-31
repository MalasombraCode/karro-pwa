const CACHE_NAME = "karro-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./lista-compra.html",
  "./manifest.webmanifest",
  "./icon-180.svg",
  "./icon-192.svg",
  "./icon-512.svg",
  "https://cdn.tailwindcss.com"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(APP_SHELL.map(async asset => {
        try {
          const response = await fetch(asset, { cache: "no-cache" });
          if (response.ok || response.type === "opaque") {
            await cache.put(asset, response);
          }
        } catch {
          // La caché local se instala aunque el CDN no esté disponible.
        }
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== "opaque")) {
          return networkResponse;
        }
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
        return networkResponse;
      }).catch(() => caches.match("./lista-compra.html"));
    })
  );
});
