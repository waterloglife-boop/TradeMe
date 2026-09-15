import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BM449LMNPAsxt2Lslv2z-pn1PEB3VQmm5eBYzNgVGrOCcqcj4zlsY9skquflIo3zfHFrk10aT5FmVYkEivVD7A0';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rJhWsY6uYAYKbUDStYW-n_XUFYkD_jNOD06FfadkxHE';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@trademe.local';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ekpitdijyfnsjhdpaqde.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcGl0ZGlqeWZuc2poZHBhcWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDA3MTMsImV4cCI6MjEwMzMxNjcxM30.k4vEtxE5XEY8oBolYYvw9EWANDX3zIu2mjZEscvn6pc';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { targetStoreId, targetAuthorName, title, body: msgBody, url = '/', tag = 'trademe-alert', icon = '/pwa-192x192.png' } = body;

    if (!targetStoreId && !targetAuthorName) {
      return res.status(400).json({ error: 'targetStoreId or targetAuthorName is required' });
    }

    let query = supabase.from('push_subscriptions').select('*');

    if (targetStoreId) {
      query = query.eq('store_id', targetStoreId);
    } else if (targetAuthorName) {
      const { data: authorStores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_name', targetAuthorName);
      if (authorStores && authorStores.length > 0) {
        const storeIds = authorStores.map((s) => s.id);
        query = query.in('store_id', storeIds);
      } else {
        return res.status(200).json({ success: true, sent: 0, message: 'Author store not found' });
      }
    }

    const { data: subs, error: subError } = await query;

    if (subError) {
      console.error('[WebPush] Error fetching subscriptions:', subError);
      return res.status(500).json({ error: subError.message });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'No active push subscriptions for target store' });
    }

    const payload = JSON.stringify({
      title: title || 'TradeMe 알림',
      body: msgBody || '새로운 소식이 도착했습니다.',
      icon: icon,
      url: url,
      tag: tag,
    });

    let sentCount = 0;
    const staleIds = [];

    await Promise.all(
      subs.map(async (row) => {
        try {
          if (!row.subscription || !row.subscription.endpoint) return;
          await webpush.sendNotification(row.subscription, payload);
          sentCount++;
        } catch (pushErr) {
          console.warn('[WebPush] Push failed for ' + row.id + ':', pushErr.statusCode, pushErr.message);
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            staleIds.push(row.id);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    return res.status(200).json({
      success: true,
      sent: sentCount,
      totalTargetSubs: subs.length,
    });
  } catch (error) {
    console.error('[WebPush Server Error]', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
