"use strict";
const CACHE = "scout-report-offline-v3";
const STATIC_ASSETS = ["/assets/auth.js", "/assets/offline-extensions.js", "/assets/offline.js", "/js/reference-mapping.js"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const cacheableReference = url.pathname.startsWith("/api/reference/") || url.pathname === "/api/reference";
  const cacheablePage = request.mode === "navigate" && (url.pathname === "/scout-form" || url.pathname === "/user-form.html");
  const cacheableAsset = STATIC_ASSETS.includes(url.pathname);
  if (!cacheableReference && !cacheablePage && !cacheableAsset) return;

  event.respondWith(fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (cacheablePage) return caches.match("/scout-form");
    return new Response(JSON.stringify({ error: "Offline data is not cached yet" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }));
});
