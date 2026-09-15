import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BM449LMNPAsxt2Lslv2z-pn1PEB3VQmm5eBYzNgVGrOCcqcj4zlsY9skquflIo3zfHFrk10aT5FmVYkEivVD7A0';

/**
 * URL-safe Base64 문자열을 PushManager 등록용 Uint8Array로 변환
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 📲 브라우저 및 안드로이드 기기의 W3C Web Push 토큰을 발급받아 Supabase에 등록
 * (화면이 꺼져있거나 앱에서 완전히 나가있을 때도 Google FCM을 통해 네이티브 푸시 수신)
 */
export async function registerPushSubscription(storeId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !storeId || storeId === 'my_store') {
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.warn('[WebPush] Push API not supported on this device/browser');
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      return false;
    }

    // 1. 기존 구독 확인
    let sub = await reg.pushManager.getSubscription();

    // 2. 없으면 새로 구독 생성
    if (!sub) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    if (!sub) return false;

    const subJson = sub.toJSON();
    const endpoint = sub.endpoint;

    // 3. Supabase push_subscriptions 테이블에 동기화
    // 이 기기의 고유 endpoint를 기준으로 조회하여 기기별 등록/갱신
    const { data: existingRows } = await supabase
      .from('push_subscriptions')
      .select('id, store_id, subscription')
      .limit(100);

    const match = existingRows?.find((r: any) => {
      const ep = r.subscription?.endpoint;
      return ep && ep === endpoint;
    });

    if (match) {
      await supabase
        .from('push_subscriptions')
        .update({
          store_id: storeId,
          subscription: subJson,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id);
    } else {
      await supabase.from('push_subscriptions').insert({
        store_id: storeId,
        subscription: subJson,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log('[WebPush] Successfully registered push subscription for store:', storeId);
    return true;
  } catch (err) {
    console.warn('[WebPush] Push subscription registration notice:', err);
    return false;
  }
}

export interface BackgroundPushPayload {
  targetStoreId?: string;
  targetAuthorName?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * 🚀 상대방 스마트폰으로 백그라운드 Web Push (Google FCM) 발송 트리거
 * (상대방이 앱을 닫고 나가있거나 화면이 꺼져있어도 즉시 상단바 배너 + 진동 작동)
 */
export async function triggerBackgroundPush(payload: BackgroundPushPayload): Promise<void> {
  try {
    fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((fetchErr) => {
      console.warn('[WebPush] Background push fetch notice:', fetchErr);
    });
  } catch (err) {
    console.warn('[WebPush] Failed to dispatch push trigger:', err);
  }
}
