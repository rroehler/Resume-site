const CACHE_NAME = 'financial-friday-shell-v1';
const APP_SHELL = [
  'budget.html',
  'styles.css?v=3',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation/API calls (Firebase, Firestore) so live data is
// always fresh; cache-first fallback only for the static app shell files so
// the app still opens (showing the login screen) when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept Firebase/Firestore/Google API calls — always go to network
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('cloudfunctions.net')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update the cache with the fresh copy for next time
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
