const C = 'tudum-v1', F = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
// ponytail: bump C when files change, or users keep the old cache
addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(F))));
addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
