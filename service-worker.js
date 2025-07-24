self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('app-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './script.js',
        './manifest.json',
        './LCG.png',
        './Torneo.Tournament'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
