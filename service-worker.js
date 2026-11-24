// service-worker.js — gerado pelo Mini SK em 24/11/2026, 05:43:30
// Não precisa mexer: ele guarda sozinho o que o app usa.
const PREFIXO = 'sk-haku-arrumado-2-cirurgiao-e-tr-';
const CACHE = PREFIXO + 'mwug6ki3';
// Lista feita automaticamente (para funcionar sem internet logo após instalar)
const GUARDAR = [
  "./",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/css/01-estilo.css",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/favicon.ico",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/apple-touch-icon.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-16.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-32.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-48.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-72.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-96.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-128.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-144.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-152.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-180.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-192.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-384.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon-512.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/icon.svg",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/maskable-192.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/maskable-512.png",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/icons/maskable.svg",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/index.html",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/01-funcoes-decode.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/02-funcoes-lerarquivos.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/03-funcoes-renderlistaarq.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/04-funcoes-tokensestrutura.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/05-funcoes-trechohtml.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/06-funcoes-medir.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/07-funcoes-salvarsessao.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/08-funcoes-difflinhas.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/09-funcoes-inserirnoa.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/10-funcoes-renderdeps.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/11-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/12-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/13-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/14-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/15-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/js/16-inicio.js",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/manifest.json",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/PLANO.md",
  "./2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO-modular/service-worker.js",
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
  "./manifest.json"
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
