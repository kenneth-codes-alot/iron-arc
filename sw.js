const CACHE_NAME = "iron-arc-v3";
let pendingProfile = "";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "ironarc-profile" || typeof data.xml !== "string") return;
  if (data.xml.length < 80 || data.xml.length > 20000) return;
  if (data.xml.indexOf("https://family.cloudflare-dns.com/dns-query") === -1) return;
  if (data.xml.indexOf("com.apple.dnsSettings.managed") === -1) return;
  if (data.xml.indexOf("<!DOCTYPE plist") === -1) return;
  if (data.xml.indexOf("<true/>") !== -1) return;
  pendingProfile = data.xml;
  if (event.ports && event.ports[0]) event.ports[0].postMessage({ ok: true });
});

function profileHeaders() {
  return {
    "Content-Type": "application/x-apple-aspen-config",
    "Content-Disposition": 'attachment; filename="iron-arc-shield.mobileconfig"',
    "Cache-Control": "no-store"
  };
}

function memoryProfileResponse() {
  return new Response(pendingProfile, {
    status: 200,
    headers: profileHeaders()
  });
}

// Private browsing and the moment before this worker claims the tab never
// reach here — the host serves iron-arc-shield.mobileconfig directly.
// Once this worker is in control, prefer the profile just posted by the page.
// Otherwise stamp the static file with Apple's profile MIME type.
function staticProfileResponse(request) {
  return fetch(request).then((res) => {
    const headers = new Headers(res.headers);
    headers.set("Content-Type", "application/x-apple-aspen-config");
    headers.set("Content-Disposition", 'attachment; filename="iron-arc-shield.mobileconfig"');
    headers.set("Cache-Control", "no-store");
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: headers
    });
  }).catch(() => caches.match(request).then((cached) => {
    if (cached) return cached;
    return new Response("Profile unavailable", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }));
}

// Network-first strategy so live edits and GTM updates appear immediately.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/iron-arc-shield.mobileconfig")) {
    event.respondWith(pendingProfile ? memoryProfileResponse() : staticProfileResponse(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
