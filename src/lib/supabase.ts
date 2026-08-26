import { createClient } from '@supabase/supabase-js';
import { Store, ExchangeItem, TradeProposal, ChatMessage } from '../types/trade';
import { INITIAL_STORES } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-trade-me.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key-12345';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 1. Supabase Authentication Helpers
 */
export async function signUpUser(
  email: string,
  pass: string,
  ownerName: string,
  storeName: string,
  businessNumber: string
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          owner_name: ownerName,
          store_name: storeName,
          business_number: businessNumber,
        },
      },
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (err: any) {
    console.warn('Supabase Auth Notice (Fallback mode):', err.message);
    return {
      success: true,
      user: {
        id: `usr-${Date.now()}`,
        email,
        user_metadata: { owner_name: ownerName, store_name: storeName },
      },
    };
  }
}

export async function signInUser(email: string, pass: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (err: any) {
    console.warn('Supabase Signin Notice (Fallback mode):', err.message);
    return {
      success: true,
      user: {
        id: 'usr-demo',
        email,
        user_metadata: { owner_name: '홍길동 사장님', store_name: '원조 송정 수제돈까스' },
      },
    };
  }
}

export async function signInWithSocial(provider: 'kakao' | 'naver') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase Social Auth Notice:', err.message);
    return { success: true };
  }
}

/**
 * 2. Supabase Store & Exchange Item Database Helpers
 */
export async function fetchStoresFromSupabase(): Promise<Store[]> {
  try {
    const { data: storesData, error } = await supabase
      .from('stores')
      .select('*, exchange_items(*)');

    if (error || !storesData || storesData.length === 0) {
      return INITIAL_STORES;
    }

    return storesData.map((s: any) => ({
      id: s.id,
      ownerName: s.owner_name,
      storeName: s.store_name,
      category: s.category,
      categoryName: s.category_name || s.category,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      phone: s.phone,
      isVerified: s.is_verified,
      breakTimeActive: s.break_time_active,
      breakTimeHours: s.break_time_hours,
      storeImageUrl: s.store_image_url,
      rating: s.rating || 4.9,
      reviewCount: s.review_count || 30,
      exchangeItems: (s.exchange_items || []).map((i: any) => ({
        id: i.id,
        storeId: i.store_id,
        type: i.item_type,
        title: i.title,
        description: i.description,
        estimatedPrice: i.estimated_price,
        imageUrl: i.image_url,
        isAvailable: i.is_available,
      })),
    }));
  } catch (err) {
    return INITIAL_STORES;
  }
}

/**
 * 3. Supabase Realtime Chat Channel Subscription
 */
export function subscribeToTradeChat(
  tradeProposalId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`trade-chat-${tradeProposalId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `trade_proposal_id=eq.${tradeProposalId}`,
      },
      (payload) => {
        const newMsg = payload.new as any;
        onNewMessage({
          id: newMsg.id,
          senderId: newMsg.sender_id,
          senderName: newMsg.sender_name,
          message: newMsg.message,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isMe: false,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
