/* Juju Jacaré – service worker: funciona offline (jogos e páginas) */
const V = 'jj-v2';
const CORE = ["/", "/index.html", "/jogos/", "/jogos/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/og-juju.jpg", "/jogos/img/borboleta.webp", "/jogos/img/carvao.webp", "/jogos/img/carvao_cinza.webp", "/jogos/img/ceu.webp", "/jogos/img/ceu_cinza.webp", "/jogos/img/coelho.webp", "/jogos/img/flor.webp", "/jogos/img/flor_cinza.webp", "/jogos/img/formiga.webp", "/jogos/img/joaninha.webp", "/jogos/img/juju.webp", "/jogos/img/juju_cinza.webp", "/jogos/img/laranja.webp", "/jogos/img/laranja_cinza.webp", "/jogos/img/logo.webp", "/jogos/img/maca.webp", "/jogos/img/maca_cinza.webp", "/jogos/img/nuvem.webp", "/jogos/img/nuvem_cinza.webp", "/jogos/img/pato.webp", "/jogos/img/sol.webp", "/jogos/img/sol_cinza.webp", "/jogos/img/ursinha.webp", "/jogos/img/uva.webp", "/jogos/img/uva_cinza.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // páginas e lista de vídeos: rede primeiro (sempre atualizado), cache se estiver sem internet
  if (e.request.mode === 'navigate' || u.pathname.endsWith('.json') || u.pathname.endsWith('.html') || u.pathname.endsWith('/')) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('/'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; })));
});
