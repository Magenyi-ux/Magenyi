const CACHE_NAME = 'learnsphere-ai-v2';
const STATIC_ASSETS = [
    // Core App Shell
    '/',
    '/index.html',
    '/index.tsx',
    '/manifest.json',

    // Icons & Images
    '/icon-192.png',
    '/icon-512.png',
    '/maskable_icon.png',
    '/vite.svg',

    // App Source Files
    '/App.tsx',
    '/types.ts',
    '/constants.tsx',
    '/services/geminiService.ts',
    '/services/authService.ts',
    '/hooks/useTheme.ts',
    '/hooks/useLocalStorage.ts',
    '/hooks/useSpeech.ts',
    '/hooks/useActivityLogger.ts',
    '/hooks/useNotification.ts',
    '/hooks/useAuth.ts',
    '/contexts/NotificationContext.tsx',
    '/contexts/AuthContext.tsx',
    
    // Components
    '/components/Header.tsx',
    '/components/Sidebar.tsx',
    '/components/FAB.tsx',
    '/components/SolverTabs.tsx',
    '/components/Whiteboard.tsx',
    '/components/SolutionDisplay.tsx',
    '/components/XpGainToast.tsx',
    '/components/ProgressTracker.tsx',
    '/components/QuizReadyModal.tsx',
    '/components/WhiteboardToolbar.tsx',
    '/components/MiniProgressTracker.tsx',
    '/components/Notification.tsx',
    '/components/VoiceAssistantModal.tsx',
    '/components/StudyFact.tsx',
    '/components/IdleScreen.tsx',

    // Pages
    '/pages/HomePage.tsx',
    '/pages/SolverPage.tsx',
    '/pages/PracticePage.tsx',
    '/pages/NotesPage.tsx',
    '/pages/SettingsPage.tsx',
    '/pages/YouTubeSummarizerPage.tsx',
    '/pages/SuggestionsPage.tsx',
    '/pages/GeneralAiPage.tsx',
    '/pages/ProfilePage.tsx',
    '/pages/QuizPlayerPage.tsx',
    '/pages/EssayGraderPage.tsx',
    '/pages/CalendarPage.tsx',
    '/pages/AuthPage.tsx',
    '/pages/SetupPage.tsx',
    
    // External Dependencies
    'https://cdn.tailwindcss.com',
    'https://esm.sh/react@19.1.1',
    'https://esm.sh/react-dom@19.1.1/client',
    'https://esm.sh/react@19.1.1/jsx-runtime',
    'https://esm.sh/@google/genai@1.14.0',
    'https://esm.sh/three@0.166.1'
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