const CACHE_VERSION = "human-holo-legal-review-separated-backend-1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names.map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
  Absichtlich kein Fetch-Cache.

  Dadurch lädt Human Holo index.html,
  die verbindliche Backend-Sperre und alle anderen Dateien
  direkt vom aktuellen Stand.
*/
