// Service worker — security-hardened
// - Never caches authenticated/API/Supabase/edge-function requests
// - Cache-first only for static assets we control
// - Network-first for navigations to avoid stale HTML/theme
const CACHE_NAME = 'mytinglebox-sw-v6';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.png',
];

// Never cache these hosts / paths (auth, PII, tokens, dynamic API)
const NO_CACHE_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /\.stripe\.com$/i,
  /api\.openpix\.com\.br$/i,
];
const NO_CACHE_PATH_PATTERNS = [
  /^\/auth(\/|$)/i,
  /^\/entrar(\/|$)/i,
  /^\/admin(-master)?(\/|$)/i,
  /^\/partner(\/|$)/i,
  /^\/vip(\/|$)/i,
  /^\/meus-pedidos(\/|$)/i,
  /^\/perfil(\/|$)/i,
  /^\/reset-password(\/|$)/i,
  /^\/functions\//i,
];

function isBypass(request) {
  try {
    const url = new URL(request.url);
    if (request.method !== 'GET') return true;
    if (request.headers.get('Authorization')) return true;
    if (request.headers.get('authorization')) return true;
    if (request.headers.get('range')) return true; // audio/video partials
    if (NO_CACHE_HOST_PATTERNS.some((re) => re.test(url.hostname))) return true;
    if (url.origin === self.location.origin && NO_CACHE_PATH_PATTERNS.some((re) => re.test(url.pathname))) return true;
    return false;
  } catch {
    return true;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept authenticated / API / sensitive requests
  if (isBypass(request)) return;

  // Navigations: network-first, no cache write
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Static assets: cache-first, opaque-safe
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache same-origin, ok responses, non-opaque
        try {
          const url = new URL(request.url);
          if (
            response &&
            response.ok &&
            response.type === 'basic' &&
            url.origin === self.location.origin
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
        } catch {
          // ignore
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'Novidade!',
    body: 'Você tem uma nova atualização.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: !!data.requireInteraction,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/meus-pedidos';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(urlToOpen);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
