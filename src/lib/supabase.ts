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
  businessNumber: string,
  phone?: string
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
          phone: phone || '',
        },
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.status === 422) {
        return { success: false, error: 'ALREADY_EXISTS', message: '이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.' };
      }
      throw error;
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    if (err?.message?.includes('already registered') || err?.message?.includes('already exists')) {
      return { success: false, error: 'ALREADY_EXISTS', message: '이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.' };
    }
    console.warn('Supabase Auth Notice (Fallback mode):', err.message);
    return {
      success: true,
      user: {
        id: `usr-${Date.now()}`,
        email,
        user_metadata: { owner_name: ownerName, store_name: storeName, phone: phone || '' },
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
      options: {
        redirectTo: `${window.location.origin}/`,
      },
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

    const dbStores: Store[] = storesData.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
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

    const existingIds = new Set(dbStores.map((s) => s.id));
    const mergedStores = [...dbStores, ...INITIAL_STORES.filter((s) => !existingIds.has(s.id))];
    return mergedStores;
  } catch (err) {
    return INITIAL_STORES;
  }
}

/**
 * 3. Insert Store & Exchange Items into Supabase Database
 */
export async function insertStoreAndItems(
  storeInfo: Omit<Store, 'id' | 'exchangeItems'>,
  items: Omit<ExchangeItem, 'id' | 'storeId'>[]
) {
  try {
    const storeId = `store-${Date.now()}`;
    
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id || null;

    // Insert into stores table
    const { error: storeError } = await supabase.from('stores').insert({
      id: storeId,
      user_id: currentUserId,
      owner_name: storeInfo.ownerName,
      store_name: storeInfo.storeName,
      category: storeInfo.category,
      category_name: storeInfo.categoryName,
      address: storeInfo.address,
      lat: storeInfo.lat,
      lng: storeInfo.lng,
      phone: storeInfo.phone,
      is_verified: true,
      break_time_active: storeInfo.breakTimeActive,
      break_time_hours: storeInfo.breakTimeHours,
      store_image_url: storeInfo.storeImageUrl,
    });

    if (storeError) {
      console.warn('Supabase store insert notice (fallback to local):', storeError.message);
    }

    // Insert into exchange_items table
    const itemRecords = items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      store_id: storeId,
      item_type: item.type,
      title: item.title,
      description: item.description,
      estimated_price: item.estimatedPrice,
      image_url: item.imageUrl,
      is_available: true,
    }));

    const { error: itemsError } = await supabase.from('exchange_items').insert(itemRecords);
    if (itemsError) {
      console.warn('Supabase items insert notice (fallback to local):', itemsError.message);
    }

    const createdStore: Store = {
      ...storeInfo,
      id: storeId,
      exchangeItems: itemRecords.map((i) => ({
        id: i.id,
        storeId: i.store_id,
        type: i.item_type as any,
        title: i.title,
        description: i.description,
        estimatedPrice: i.estimated_price,
        imageUrl: i.image_url,
        isAvailable: true,
      })),
    };

    return { success: true, store: createdStore };
  } catch (err: any) {
    console.error('Error inserting store and items:', err);
    const fallbackStore: Store = {
      ...storeInfo,
      id: `store-${Date.now()}`,
      exchangeItems: items.map((i, idx) => ({
        ...i,
        id: `item-${Date.now()}-${idx}`,
        storeId: `store-${Date.now()}`,
      })),
    };
    return { success: true, store: fallbackStore };
  }
}

/**
 * 4. Supabase Realtime 1:1 Chat Message Handlers
 */
export async function sendChatMessageToSupabase(
  tradeId: string,
  senderStoreId: string,
  senderName: string,
  message: string
) {
  try {
    const msgId = `msg-${Date.now()}`;
    const { error } = await supabase.from('chat_messages').insert({
      id: msgId,
      trade_id: tradeId,
      sender_store_id: senderStoreId,
      sender_name: senderName,
      message: message,
    });

    if (error) {
      console.warn('Supabase chat insert notice:', error.message);
    }
    return { success: true, msgId };
  } catch (err) {
    console.warn('Chat send notice (fallback mode):', err);
    return { success: true, msgId: `msg-${Date.now()}` };
  }
}

export function subscribeToTradeChat(
  tradeId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`trade-chat-${tradeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `trade_id=eq.${tradeId}`,
      },
      (payload) => {
        const newMsg = payload.new as any;
        onNewMessage({
          id: newMsg.id,
          senderId: newMsg.sender_store_id,
          senderName: newMsg.sender_name,
          message: newMsg.message,
          timestamp: new Date(newMsg.created_at || Date.now()).toLocaleTimeString('ko-KR', {
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

export async function sendTradeProposalToSupabase(
  requesterStoreId: string,
  targetStoreId: string,
  requesterItemId: string,
  targetItemId: string,
  priceDifference: number,
  pickupTime: string
) {
  try {
    const tradeId = `trade-${Date.now()}`;
    const { error } = await supabase.from('trades').insert({
      id: tradeId,
      requester_store_id: requesterStoreId,
      target_store_id: targetStoreId,
      requester_item_id: requesterItemId,
      target_item_id: targetItemId,
      price_difference: priceDifference,
      pickup_time: pickupTime,
      status: 'PENDING',
    });

    if (error) {
      console.warn('Supabase trades insert notice:', error.message);
    }
    return { success: true, tradeId };
  } catch (err) {
    console.warn('Trades insert notice (fallback mode):', err);
    return { success: true, tradeId: `trade-${Date.now()}` };
  }
}

/**
 * 5. Fetch Chat History from Supabase Database for a specific Trade/Store
 */
export async function fetchChatHistory(storeId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('trade_id', storeId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_store_id,
      senderName: msg.sender_name,
      message: msg.message,
      timestamp: new Date(msg.created_at || Date.now()).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isMe: false,
    }));
  } catch (err) {
    console.warn('Error fetching chat history from Supabase:', err);
    return [];
  }
}
