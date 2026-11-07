self.addEventListener("install", function () {
  self.skipWaiting();
});

function wipeCaches() {
  var named = ["iron-arc-v1", "iron-arc-v2", "iron-arc-v3", "iron-arc-v4", "iron-arc-v5"];
  function doomed(name) {
    return named.indexOf(name) !== -1 || name.indexOf("iron-arc-") === 0;
  }
  return caches.keys().then(function (keys) {
    var pending = named.map(function (name) { return caches.delete(name); });
    keys.forEach(function (name) {
      if (doomed(name)) pending.push(caches.delete(name));
    });
    return Promise.all(pending);
  }).catch(function () {
    return Promise.all(named.map(function (name) { return caches.delete(name); }));
  });
}

self.addEventListener("activate", function (event) {
  event.waitUntil(
    wipeCaches()
      .then(function () { return self.clients.claim(); })
      .then(function () { return self.clients.matchAll({ type: "window", includeUncontrolled: true }); })
      .then(function (clients) {
        var waits = [];
        clients.forEach(function (client) {
          var path = "";
          try { path = new URL(client.url).pathname; } catch (e) { return; }
          if (path === "/iron-arc/" || path === "/iron-arc/index.html") {
            waits.push(client.navigate(client.url));
          }
        });
        return Promise.all(waits);
      })
      .then(function () { return self.registration.unregister(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request, { cache: "reload" }).catch(function () {
      return new Response(
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex, nofollow\"><title>404 \u2014 Not Found</title></head><body><h1>404 \u2014 Not Found</h1><p>The requested page does not exist.</p></body></html>",
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
          }
        }
      );
    })
  );
});