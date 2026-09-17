const CACHE_NAME = "pam-holo-v2-network-safe-shell";

const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sol-holo-ui.css",
  "/sol-holo-ui.js",
  "/media-tools.js",
  "/human-holo-logo.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;
  const appShellRequest =
    sameOrigin &&
    APP_FILES.includes(requestUrl.pathname);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        return (await caches.match("/index.html")) ||
          (await caches.match("/")) ||
          Response.error();
      })
    );
    return;
  }

  if (!appShellRequest) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      return (await caches.match(event.request)) ||
        (await caches.match(requestUrl.pathname)) ||
        Response.error();
    })
  );
});
