/* UniMart – service worker: lets the site install as an app and open without internet.
   Network first (so updates show at once), falls back to the saved copy when offline.
   Firebase and other sites are never cached. Bump VERSION when you change this file. */
const VERSION = "unimart-v2";
const SHELL = [
  "./", "index.html", "admin.html", "manifest.webmanifest", "css/style.css",
  "js/config.js", "js/data.js", "js/ui.js", "js/db-local.js", "js/db-firebase.js", "js/store.js", "js/app.js", "js/admin.js",
  "img/logo.svg", "img/icon-192.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
