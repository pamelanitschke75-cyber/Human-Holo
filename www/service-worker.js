const CACHE_VERSION =
  "human-holo-297-pam-holo-restored-entry-network-v11";

const APP_SHELL = Object.freeze([
  "./",
  "./index.html",
  "./manifest.json",
  "./human-holo-logo.png",
  "./file_000000009bf88246b8f682a46e1a429d.png",
  "./icon-192.png",
  "./human-holo-theme.css",
  "./sol-holo-ui.css",
  "./sol-holo-chat-115.css",
  "./sol-holo-wow.css",
  "./sol-holo-backup.css",
  "./human-holo-ai-policy.js",
  "./sol-motion-profile.js",
  "./remote-audio-level.js",
  "./voice-motion-driver.js",
  "./original-full-sync.js",
  "./media-tools.js",
  "./pam-holo-network-resilience.js",
  "./live-camera-face-privacy.mjs",
  "./sol-holo-ui.js",
  "./app-lock-bootstrap.mjs",
  "./trusted-app-session.mjs",
  "./consent-ui-bootstrap.mjs",
  "./consent-signature.mjs",
  "./human-holo-animal-holos.mjs",
  "./human-holo-animal-core.mjs",
  "./sol-holo-backup.mjs",
  "./sol-holo-backup-core.mjs",
  "./human-holo-chatgpt-memory-bridge.mjs",
  "./human-holo-durable-memory.mjs"
]);

const APP_SHELL_PATHS = new Set(
  APP_SHELL.map((entry) => new URL(entry, self.location.href).pathname)
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate" && sameOrigin) {
    event.respondWith(
      fetch(event.request).catch(async () =>
        (await caches.match("./index.html")) ||
        (await caches.match("./")) ||
        Response.error()
      )
    );
    return;
  }

  if (!sameOrigin || !APP_SHELL_PATHS.has(requestUrl.pathname)) {
    return;
  }

  /*
    Nur die feste, nicht persönliche App-Hülle erhält einen Offline-Fallback.
    API-, Erinnerungs-, Kontakt- und Gesundheitsantworten werden nie gecacht.
  */
  event.respondWith(
    fetch(event.request).catch(async () =>
      (await caches.match(event.request)) ||
      (await caches.match(requestUrl.pathname)) ||
      Response.error()
    )
  );
});
