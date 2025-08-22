const CACHE_NAME = 'learnsphere-ai-v3';
const STATIC_ASSETS = [
    // Core App Shell
    '/',
    '/index.html',
    '/manifest.json',

    // Icons & Images from public folder
    '/icon-192.png',
    '/icon-512.png',
    '/maskable_icon.png',
    '/vite.svg',
    
    // External Dependencies (still useful to cache)
    'https://cdn.tailwindcss.com',
];

// Install event: cache the app shell and critical assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache. Caching app shell and critical assets.');
            return cache.addAll(STATIC_ASSETS).catch(error => {
                console.error('Failed to cache all static assets during install:', error);
            });
        })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: Stale-while-revalidate strategy
self.addEventListener('fetch', event => {
    // We only handle GET requests and ignore API calls
    if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
        return;
    }
    
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                // Fetch from network in parallel to update the cache
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(error => {
                    // Network request failed, this happens when offline.
                    // If we don't have a cached response, the request will fail.
                    console.warn(`Fetch failed for ${event.request.url}. Serving from cache if available.`);
                    // For navigation requests, if network fails and there's no cache, fallback to the main page.
                    if (event.request.mode === 'navigate' && !response) {
                        return caches.match('/index.html');
                    }
                });
                
                // Return cached response immediately if it exists, otherwise wait for the network.
                return response || fetchPromise;
            });
        })
    );
});
