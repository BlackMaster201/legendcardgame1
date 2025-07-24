self.addEventListener('install', e => 
  e.waitUntil(
    caches.open('static').then(cache => 
      cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './app-tournament.js',
        './LCG.png'
      ])
    )
  )
);
self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)))
);