const CACHE = 'typeflow-v2';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/themes.css',
  './js/storage.js', './js/themes.js', './js/stats.js', './js/keyboard.js',
  './js/engine.js', './js/content.js', './js/adaptive.js', './js/app.js', './js/pwa.js',
  './icons/icon-192.svg', './icons/icon-512.svg', './icons/icon-maskable-512.svg',
  './content/words-en-1000.json', './content/quotes-classic.json', './content/quotes-coding.json',
  './content/code-javascript.json', './content/code-python.json', './content/code-html-css.json',
  './content/numbers.json', './content/symbols.json', './content/bigrams.json',
  './content/trigrams.json', './content/pangrams.json', './content/phrases-en.json',
  './content/literature.json', './content/home-row-words.json', './content/top-row-words.json',
  './content/bottom-row-words.json', './content/capitals.json', './content/nonsense-syllables.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});