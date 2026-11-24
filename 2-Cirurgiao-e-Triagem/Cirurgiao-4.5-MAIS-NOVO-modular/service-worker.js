// service-worker.js — gerado pelo Mini SK em 24/11/2026, 05:43:25
// Não precisa mexer: ele guarda sozinho o que o app usa.
const PREFIXO = 'sk-cirurgiao-de-codigo-4-4-';
const CACHE = PREFIXO + 'mwug6gb9';
// Lista feita automaticamente (para funcionar sem internet logo após instalar)
const GUARDAR = [
  "./",
  "./css/01-estilo.css",
  "./favicon.ico",
  "./icons/apple-touch-icon.png",
  "./icons/icon-16.png",
  "./icons/icon-32.png",
  "./icons/icon-48.png",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/maskable.svg",
  "./index.html",
  "./js/01-funcoes-decode.js",
  "./js/02-funcoes-lerarquivos.js",
  "./js/03-funcoes-renderlistaarq.js",
  "./js/04-funcoes-tokensestrutura.js",
  "./js/05-funcoes-trechohtml.js",
  "./js/06-funcoes-medir.js",
  "./js/07-funcoes-salvarsessao.js",
  "./js/08-funcoes-difflinhas.js",
  "./js/09-funcoes-inserirnoa.js",
  "./js/10-funcoes-renderdeps.js",
  "./js/11-inicio.js",
  "./js/12-inicio.js",
  "./js/13-inicio.js",
  "./js/14-inicio.js",
  "./js/15-inicio.js",
  "./js/16-inicio.js",
  "./manifest.json",
  "./PLANO.md"
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(GUARDAR.map((u) => c.add(u).catch(() => null)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIXO) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primeiro a internet (sempre a versão nova); sem internet, a cópia guardada.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      // Igual ao Workbox da Replit: página que não existe (rota do app) abre o index
      if (res.status === 404 && req.mode === 'navigate') return caches.match('./').then((r) => r || fetch('./'));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
