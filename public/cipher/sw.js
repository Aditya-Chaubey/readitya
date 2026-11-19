/* CIPHER service worker — makes the app installable and usable offline.
   App files: network first (always fresh when online), cache as fallback.
   Fonts: cache first. Bump VERSION when the file list changes. */
const VERSION = "cipher-v4";
const FONTS = "cipher-fonts";
const SHELL = [
  "./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-64.png",
  "./js/core.js", "./js/seed.js", "./js/operations.js", "./js/missions.js", "./js/drills.js", "./js/cases.js",
  "./js/treasury.js", "./js/network.js", "./js/arsenal.js", "./js/journal.js", "./js/vault.js", "./js/settings.js", "./js/briefing.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      Promise.race([fetch(req), timeout(4000)])
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : null))
          .then((r) => r || Response.error()))
    );
    return;
  }

  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.open(FONTS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; })))
    );
  }
});
