/* Offline cache for the app shell. Works when served over http(s) or localhost. */
const CACHE = 'flight-plan-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'assets/icon.svg',
  'css/tokens.css', 'css/app.css', 'css/focus.css', 'css/layout.css',
  'js/core.js', 'js/schedule.js', 'js/views.js', 'js/db.js', 'js/bank.js', 'js/focus.js', 'js/study.js', 'js/app.js', 'js/pwa.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))));
self.addEventListener('fetch', (e) => { if (e.request.method === 'GET') e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request))); });
