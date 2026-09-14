// TradeMe Ultra-Lightweight Notification Service Worker (Zero-Cache)
// 화면 백화현상 및 캐시 꼬임 방지를 위해 캐싱(fetch 이벤트 감청)을 일절 수행하지 않으며,
// 오직 스마트폰 상단바 알림(Notification/Push) 및 클릭 포커스만을 전담합니다.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 🔔 알림 클릭 시 트레이드미 창으로 즉시 포커스 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
      }
      // 열려있는 창이 없으면 새 창으로 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 📡 백그라운드 웹 푸시 수신 핸들러 (화면이 꺼져있을 때도 동작)
self.addEventListener('push', (event) => {
  let title = 'TradeMe 트레이드미';
  let body = '새로운 소식이 도착했습니다.';
  let icon = '/pwa-192x192.png';
  let tag = 'trademe-push';
  let url = '/';

  try {
    if (event.data) {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.icon) icon = data.icon;
      if (data.tag) tag = data.tag;
      if (data.url) url = data.url;
    }
  } catch (e) {
    if (event.data) {
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: tag,
    renotify: true,
    data: { url: url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
