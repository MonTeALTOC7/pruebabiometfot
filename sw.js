const CACHE = "estimador-tch-casur-v2.6.0";
const CORE = [
  "./", "./index.html", "./css/casur.css", "./js/app.js", "./js/tch-engine.js", "./js/storage.js",
  "./js/master.js", "./js/excel.js", "./js/result-image.js", "./js/visit-evidence.js", "./vendor/xlsx.bundle.js",
  "./assets/logo_casur.png", "./assets/cana-azucar-real.png",
  "./assets/icons/tch-icon.svg", "./assets/icons/tch-icon-192.png", "./assets/icons/tch-icon-512.png",
  "./data/suertes.json", "./data/productores.json", "./manifest.webmanifest", "./version.json"
];

self.addEventListener("install", (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
));

self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isMaster = url.pathname.endsWith("/data/suertes.json") || url.pathname.endsWith("/data/productores.json");
  if (isMaster) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).then((response) => {
      const copy = response.clone();
      const relative = url.pathname.endsWith("/data/suertes.json") ? "./data/suertes.json" : "./data/productores.json";
      caches.open(CACHE).then((cache) => cache.put(relative, copy));
      return response;
    }).catch(() => caches.match(url.pathname.endsWith("/data/suertes.json") ? "./data/suertes.json" : "./data/productores.json")));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});
