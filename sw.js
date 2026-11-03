const C = 'tudum-v3', F = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
// network first, cache only as offline fallback: updates show up without bumping C
addEventListener('install', e => { skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(F))); });
addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k != C).map(k => caches.delete(k)))).then(() => clients.claim())));
addEventListener('fetch', e => e.respondWith(
  fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request))));
