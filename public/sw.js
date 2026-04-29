const CACHE = "dfs-admin-v2";
const OFFLINE_URL = "/admin/inventory";

// Never intercept these — let the browser/server handle auth flows directly.
function shouldPassthrough(url) {
  const { pathname, hostname } = new URL(url);
  return (
    hostname !== self.location.hostname ||   // cross-origin (Supabase, etc.)
    pathname.startsWith("/admin/auth/") ||   // magic-link callback
    pathname.startsWith("/admin/login") ||   // login page
    pathname.startsWith("/api/") ||          // API routes
    pathname.includes("/auth/v1/")           // Supabase auth endpoints
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Always let auth/API routes go straight to the network — no SW involvement.
  if (shouldPassthrough(event.request.url)) return;

  if (event.request.mode === "navigate") {
    // Serve from network; fall back to cached shell only if truly offline.
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? Response.error())
      )
    );
    return;
  }

  // For other requests: network first, cache as fallback.
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r ?? Response.error())
    )
  );
});
