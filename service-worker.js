// Dateiname: service-worker.js
// Aethermoor Chronicles - Service Worker für PWA-Funktionalität

const CACHE_NAME = 'aethermoor-v1.0.0';
const STATIC_CACHE = 'aethermoor-static-v1.0.0';
const DYNAMIC_CACHE = 'aethermoor-dynamic-v1.0.0';

// Kern-Ressourcen die immer gecacht werden
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png'
];

// Optionale Assets die bei Bedarf gecacht werden
const OPTIONAL_ASSETS = [
    './screenshot-mobile.png',
    './screenshot-desktop.png'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker wird installiert');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Kern-Assets werden gecacht');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                // Versuche optionale Assets zu cachen (Fehler werden ignoriert)
                return caches.open(STATIC_CACHE).then((cache) => {
                    return Promise.allSettled(
                        OPTIONAL_ASSETS.map(asset => {
                            return cache.add(asset).catch(err => {
                                console.warn(`[SW] Optional asset konnte nicht gecacht werden: ${asset}`, err);
                            });
                        })
                    );
                });
            })
            .then(() => {
                console.log('[SW] Installation abgeschlossen');
                // Aktivierung erzwingen
                return self.skipWaiting();
            })
    );
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker wird aktiviert');
    
    event.waitUntil(
        caches.keys()
            .then((keyList) => {
                return Promise.all(keyList.map((key) => {
                    // Lösche alte Caches
                    if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
                        console.log('[SW] Alter Cache wird gelöscht:', key);
                        return caches.delete(key);
                    }
                }));
            })
            .then(() => {
                console.log('[SW] Aktivierung abgeschlossen');
                // Übernehme Kontrolle über alle Clients
                return self.clients.claim();
            })
    );
});

// Fetch Event Handler - Cache-First Strategie für statische Assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Ignoriere nicht-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignoriere chrome-extension und andere protokolle
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Cache-First Strategie für alle Requests
    event.respondWith(
        caches.match(request)
            .then((response) => {
                // Cache Hit - Return cached version
                if (response) {
                    console.log('[SW] Cache Hit:', request.url);
                    return response;
                }
                
                // Cache Miss - Lade von Netzwerk und cache es
                console.log('[SW] Cache Miss, lade von Netzwerk:', request.url);
                
                return fetch(request)
                    .then((response) => {
                        // Prüfe ob Response valide ist
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone response für Cache
                        const responseToCache = response.clone();
                        
                        // Cache nur unsere eigenen Assets
                        if (url.origin === location.origin) {
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                    console.log('[SW] Asset zu Dynamic Cache hinzugefügt:', request.url);
                                });
                        }
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch fehlgeschlagen:', error);
                        
                        // Fallback für HTML-Seiten
                        if (request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // Für andere Assets, return eine einfache Offline-Response
                        return new Response('Offline - Asset nicht verfügbar', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background Sync für zukünftige Features
self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync:', event.tag);
    
    if (event.tag === 'save-game-data') {
        event.waitUntil(
            syncGameData()
        );
    }
});

// Push Notifications für zukünftige Features
self.addEventListener('push', (event) => {
    console.log('[SW] Push empfangen');
    
    const options = {
        body: event.data ? event.data.text() : 'Neue Dimension verfügbar!',
        icon: './icon-192x192.png',
        badge: './icon-192x192.png',
        tag: 'aethermoor-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Spiel öffnen'
            },
            {
                action: 'dismiss', 
                title: 'Ignorieren'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Aethermoor Chronicles', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification Click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Fokussiere ein existierendes Fenster wenn vorhanden
                    for (const client of clientList) {
                        if (client.url === location.origin + '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Öffne neues Fenster wenn keins da ist
                    if (clients.openWindow) {
                        return clients.openWindow('./');
                    }
                })
        );
    }
});

// Message Handler für Kommunikation mit main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message empfangen:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearAllCaches().then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Helper Functions
async function syncGameData() {
    try {
        // Zukünftige Implementation für Cloud-Sync
        console.log('[SW] Game Data Sync ausgeführt');
        return Promise.resolve();
    } catch (error) {
        console.error('[SW] Game Data Sync fehlgeschlagen:', error);
        return Promise.reject(error);
    }
}

async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }
        
        return Math.round(totalSize / 1024); // Return in KB
    } catch (error) {
        console.error('[SW] Cache Größe konnte nicht ermittelt werden:', error);
        return 0;
    }
}

async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(name => {
            if (name !== STATIC_CACHE) { // Behalte Core Cache
                return caches.delete(name);
            }
        });
        
        await Promise.all(deletePromises);
        console.log('[SW] Alle Dynamic Caches gelöscht');
        return true;
    } catch (error) {
        console.error('[SW] Cache löschen fehlgeschlagen:', error);
        return false;
    }
}

// Error Handler
self.addEventListener('error', (event) => {
    console.error('[SW] Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Service Worker Unhandled Rejection:', event.reason);
});

console.log('[SW] Service Worker geladen');