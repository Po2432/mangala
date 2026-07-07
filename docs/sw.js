const CACHE_NAME = 'mangala-v1.5.0';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Tüm dosyalar önbelleğe alındı.');
                return cache.addAll(ASSETS);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request);
            })
    );
});
