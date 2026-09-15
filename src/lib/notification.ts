import { playNotificationChime } from './sound';

export interface DeviceNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
}

/**
 * 🔔 스마트폰 상단바 배너 + 진동 + '띵동' 소리를 동시에 발생하는 네이티브 알림 발송 함수
 * 안드로이드 크롬, 삼성 인터넷, 데스크톱 브라우저 모두 지원
 */
export async function showDeviceNotification(
  title: string,
  options: DeviceNotificationOptions = {}
): Promise<boolean> {
  // 1. 소리 알람은 언제나 최우선 실행
  try {
    playNotificationChime();
  } catch (audioErr) {
    console.warn('[Notification] Audio chime failed:', audioErr);
  }

  // 2. 브라우저 알림 API 지원 여부 확인
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // 3. 권한이 'granted'가 아니면 시스템 알림 불가
  if (Notification.permission !== 'granted') {
    return false;
  }

  const notifOptions: any = {
    body: options.body || '',
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/favicon-32x32.png',
    tag: options.tag || 'trademe-alert',
    renotify: true,
    data: {
      url: options.url || '/',
      ...options.data,
    },
  };

  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      notifOptions.vibrate = [200, 100, 200, 100, 200];
    }
  } catch (err) {}

  // 4. 모바일 안드로이드(크롬/삼성인터넷)는 반드시 ServiceWorkerRegistration.showNotification() 사용
  if ('serviceWorker' in navigator) {
    try {
      // 서비스 워커 준비 대기 (최대 1.5초 타임아웃 방어)
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const reg = await Promise.race([swReadyPromise, timeoutPromise]);

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('[Notification] SW showNotification failed, trying fallback:', swErr);
    }
  }

  // 5. 데스크톱 브라우저 폴백 (new Notification)
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (notifErr) {
    console.warn('[Notification] Native Notification constructor failed:', notifErr);
    return false;
  }
}
