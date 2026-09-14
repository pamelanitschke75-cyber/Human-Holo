const CACHE_VERSION = "human-holo-root-redirect-no-cache-1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.map(name => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Kein Fetch-Handler: Der frühere GitHub-Pages-App-Cache ist abgeschaltet.
void CACHE_VERSION;
