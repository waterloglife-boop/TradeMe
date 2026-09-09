import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { NaverMapView } from './components/NaverMapView';
import { StoreDetailDrawer } from './components/StoreDetailDrawer';
import { RegisterStoreAndItemsModal } from './components/RegisterStoreAndItemsModal';
import { TradeProposalModal } from './components/TradeProposalModal';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { MenuTestApplyModal } from './components/MenuTestApplyModal';
import { MenuTestDashboardModal } from './components/MenuTestDashboardModal';
import { RegisterMenuTestModal } from './components/RegisterMenuTestModal';
import { ManageExchangeItemsModal } from './components/ManageExchangeItemsModal';
import { TradeDashboardModal } from './components/TradeDashboardModal';
import { CommunityModal } from './components/CommunityModal';
import { CouponWalletModal } from './components/CouponWalletModal';
import {
  fetchStoresFromSupabase,
  subscribeToTradeChat,
  sendChatMessageToSupabase,
  sendTradeProposalToSupabase,
  fetchTradeProposalsFromSupabase,
  fetchMenuTestApplications,
  fetchChatHistory,
  saveProfileToSupabase,
  updateStoreStatusInSupabase,
  fetchUserProfileFromSupabase,
  fetchUserStoreFromSupabase,
  signOutUser,
  fetchStoredVouchers,
  supabase,
} from './lib/supabase';
import { Store, ExchangeItem, TradeProposal, ChatMessage, MenuTestApplication, MenuTestCampaign } from './types/trade';
import { MapPin, X, ArrowRight, Sparkles } from 'lucide-react';

const INITIAL_EMPTY_STORE_STATE: Store = {
  id: '',
  ownerName: '',
  storeName: '',
  category: 'FOOD',
  categoryName: '외식업',
  address: '',
  lat: 35.3594007321187,
  lng: 129.041885145232,
  phone: '',
  isVerified: false,
  breakTimeActive: false,
  breakTimeHours: '10:00 - 22:00',
  storeImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  exchangeItems: [],
  rating: 5.0,
  reviewCount: 0,
  isMenuTesting: false,
};

export const App: React.FC = () => {
  const [myStore, setMyStore] = useState<Store>(() => {
    try {
      const saved = localStorage.getItem('trademe_my_store');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMPTY_STORE_STATE;
  });
  const [stores, setStores] = useState<Store[]>([]);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    (window as any).__testSetSelectedStore = (s: Store | null) => setSelectedStore(s);
    (window as any).__testOpenTradeDashboard = () => setIsTradeDashboardOpen(true);
    (window as any).__testOpenCouponWallet = () => setIsCouponWalletOpen(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyBreakTime, setOnlyBreakTime] = useState<boolean>(false);
  const [onlyMenuTesting, setOnlyMenuTesting] = useState<boolean>(false);
  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'NAVER'>('NAVER');

  // Notification Badges State
  const [pendingTradeCount, setPendingTradeCount] = useState(0);
  const [pendingMenuTestCount, setPendingMenuTestCount] = useState(0);

  // ☕ 사장님 사랑방 커뮤니티 State
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  // 🎟️ 내 교환권 보관함 State (Phase 3)
  const [isCouponWalletOpen, setIsCouponWalletOpen] = useState(false);
  const [voucherWalletCount, setVoucherWalletCount] = useState<number>(() => {
    try {
      const vs = fetchStoredVouchers();
      return vs.filter((v) => v.status === 'AVAILABLE').length;
    } catch (e) {
      return 0;
    }
  });

  const refreshVoucherWalletCount = () => {
    try {
      const vs = fetchStoredVouchers(myStore.id, myStore.storeName);
      setVoucherWalletCount(vs.filter((v) => v.status === 'AVAILABLE').length);
    } catch (e) {}
  };

  // Location Picker State (비로그인 첫 방문 기준: 대한민국 표준 중심 서울시청/광화문)
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number }>(() => {
    try {
      const saved = localStorage.getItem('trademe_my_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch (e) {}
    return { lat: 37.5665, lng: 126.9780 };
  });

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return !!(localStorage.getItem('trademe_profile') || localStorage.getItem('trademe_my_store'));
    } catch (e) {
      return false;
    }
  });
  const [userOwnerName, setUserOwnerName] = useState<string>(() => {
    try {
      const p = localStorage.getItem('trademe_profile');
      if (p) {
        const po = JSON.parse(p);
        return po.owner_name || po.ownerName || '';
      }
    } catch (e) {}
    return '';
  });

  // 🌟 비로그인 상생 웰컴 플로팅 카드 & 사유 안내 알림 State
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);
  const [authModalNotice, setAuthModalNotice] = useState<string | null>(null);

  // Modals & Drawers state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isManageItemsModalOpen, setIsManageItemsModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [targetProposalItem, setTargetProposalItem] = useState<ExchangeItem | null>(null);
  const [isTradeDashboardOpen, setIsTradeDashboardOpen] = useState(false);

  // 🧪 Menu Test Application & Dashboard Modal state
  const [isMenuTestModalOpen, setIsMenuTestModalOpen] = useState(false);
  const [targetMenuTestStore, setTargetMenuTestStore] = useState<Store | null>(null);
  const [targetMenuTestCampaign, setTargetMenuTestCampaign] = useState<MenuTestCampaign | null>(null);
  const [isMenuTestDashboardOpen, setIsMenuTestDashboardOpen] = useState(false);
  const [isRegisterMenuTestModalOpen, setIsRegisterMenuTestModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MenuTestCampaign | null>(null);
  const [menuTestRefreshTrigger, setMenuTestRefreshTrigger] = useState(0);
  const [registerActiveCampaignCount, setRegisterActiveCampaignCount] = useState(0);

  // Chat state
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatTargetStore, setChatTargetStore] = useState<Store | null>(null);
  const [messagesMap, setMessagesMap] = useState<{ [storeId: string]: ChatMessage[] }>({});

  // Pure Supabase Data Loading on Initial Mount & Realtime Auth State Sync
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Clean up any legacy dummy community posts cache
        try {
          const cachedPosts = localStorage.getItem('trademe_community_posts_cache');
          if (cachedPosts && (cachedPosts.includes('post_welcome_') || cachedPosts.includes('박해운'))) {
            localStorage.removeItem('trademe_community_posts_cache');
          }
        } catch (e) {}

        // Clean up any legacy dummy seed vouchers cache
        try {
          const cachedVouchers = localStorage.getItem('trademe_vouchers');
          if (cachedVouchers && (cachedVouchers.includes('voucher-seed-') || cachedVouchers.includes('소담 한정식') || cachedVouchers.includes('헤어살롱 유') || cachedVouchers.includes('달콤 베이커리'))) {
            const parsed = JSON.parse(cachedVouchers);
            const filtered = parsed.filter((v: any) => !v.id?.startsWith('voucher-seed-') && !['소담 한정식', '헤어살롱 유', '달콤 베이커리'].includes(v.senderStoreName));
            localStorage.setItem('trademe_vouchers', JSON.stringify(filtered));
            setVoucherWalletCount(filtered.filter((v: any) => v.status === 'AVAILABLE').length);
          }
        } catch (e) {}

        // 1. Fetch all registered stores directly from Supabase (첫 화면에서는 어떤 매장도 자동 선택하지 않고 깨끗한 지도로 노출)
        const fetchedStores = await fetchStoresFromSupabase();
        setStores(fetchedStores || []);

        // 2. Check current active Supabase Auth session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session && session.user) {
          setIsLoggedIn(true);
          const metaOwner = session.user.user_metadata?.owner_name;
          const metaStore = session.user.user_metadata?.store_name;
          if (metaOwner) setUserOwnerName(metaOwner);

          const userProfile = await fetchUserProfileFromSupabase();
          if (userProfile?.owner_name) {
            setUserOwnerName(userProfile.owner_name);
          }

          const userStore = await fetchUserStoreFromSupabase();
          if (userStore) {
            setMyStore(userStore);
            try {
              localStorage.setItem('trademe_my_store', JSON.stringify(userStore));
            } catch (e) {}
            if (userStore.lat && userStore.lng) {
              setPickedLocation({ lat: userStore.lat, lng: userStore.lng });
            }
          } else if (metaStore) {
            setMyStore((prev) => ({
              ...prev,
              ownerName: metaOwner || prev.ownerName,
              storeName: metaStore || prev.storeName,
            }));
          }
        } else {
          // Check localStorage backup session (e.g. for unconfirmed email accounts or active sessions)
          try {
            const savedProfile = localStorage.getItem('trademe_profile');
            const savedStore = localStorage.getItem('trademe_my_store');
            if (savedProfile && savedStore) {
              const profileObj = JSON.parse(savedProfile);
              const storeObj = JSON.parse(savedStore);
              if (profileObj?.owner_name || profileObj?.ownerName || storeObj?.ownerName) {
                setIsLoggedIn(true);
                setUserOwnerName(profileObj.owner_name || profileObj.ownerName || storeObj.ownerName || '사장님');
                
                // Fetch fresh store from Supabase DB to ensure breakTimeActive and details are 100% synced!
                const freshUserStore = await fetchUserStoreFromSupabase();
                if (freshUserStore) {
                  setMyStore(freshUserStore);
                  try {
                    localStorage.setItem('trademe_my_store', JSON.stringify(freshUserStore));
                  } catch (e) {}
                  if (freshUserStore.lat && freshUserStore.lng) {
                    setPickedLocation({ lat: freshUserStore.lat, lng: freshUserStore.lng });
                  }
                  setStores((prevStores) =>
                    prevStores.map((s) => (s.id === freshUserStore.id ? freshUserStore : s))
                  );
                } else {
                  setMyStore(storeObj);
                  if (storeObj.lat && storeObj.lng) {
                    setPickedLocation({ lat: storeObj.lat, lng: storeObj.lng });
                  }
                }
                return;
              }
            }
          } catch (e) {}

          setIsLoggedIn(false);
          setUserOwnerName('');
          setMyStore(INITIAL_EMPTY_STORE_STATE);
        }
      } catch (err) {
        console.error('[App Error] Initial data loading exception:', err);
      }
    }

    loadInitialData();

    // 3. Listen to Supabase auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        setIsLoggedIn(true);
        const metaOwner = session.user.user_metadata?.owner_name;
        if (metaOwner) setUserOwnerName(metaOwner);

        const userProfile = await fetchUserProfileFromSupabase();
        if (userProfile?.owner_name) {
          setUserOwnerName(userProfile.owner_name);
        }

        const userStore = await fetchUserStoreFromSupabase();
        if (userStore) {
          setMyStore(userStore);
          try {
            localStorage.setItem('trademe_my_store', JSON.stringify(userStore));
          } catch (e) {}
          if (userStore.lat && userStore.lng) {
            setPickedLocation({ lat: userStore.lat, lng: userStore.lng });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear if localStorage doesn't have an active session (prevents wiping unconfirmed/fallback sessions)
        const hasLocalProfile = !!localStorage.getItem('trademe_profile');
        if (!hasLocalProfile) {
          setIsLoggedIn(false);
          setUserOwnerName('');
          setMyStore(INITIAL_EMPTY_STORE_STATE);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Refresh Pending Alert Counts (Trades + Menu Test Applications)
  const refreshPendingAlertCounts = async () => {
    try {
      // 1. Fetch pending proposals for my store
      const proposals = await fetchTradeProposalsFromSupabase(myStore.id);
      const pendingTrades = proposals.filter(
        (p) => (p.targetStoreId === myStore.id || p.targetStoreId === 'my-store') && p.status === 'PENDING'
      ).length;
      setPendingTradeCount(pendingTrades);

      // 2. Fetch pending menu test applications for my store
      const applications = await fetchMenuTestApplications(myStore.id || 'my-store');
      const pendingMenuTests = applications.filter((a) => a.status === 'PENDING').length;
      setPendingMenuTestCount(pendingMenuTests);
    } catch (e) {}
  };

  useEffect(() => {
    refreshPendingAlertCounts();
    const interval = setInterval(refreshPendingAlertCounts, 10000);
    return () => clearInterval(interval);
  }, [myStore.id]);

  // Supabase Realtime Chat Subscription & Past History Loader
  useEffect(() => {
    if (!chatTargetStore) return;

    const storeId = chatTargetStore.id;

    // 2. [초기 데이터 로딩 최적화] 과거 채팅 내역 Supabase에서 불러오기
    async function loadHistory() {
      const history = await fetchChatHistory(storeId);
      if (history && history.length > 0) {
        setMessagesMap((prev) => {
          if (prev[storeId] && prev[storeId].length > 0) return prev;
          const formattedHistory = history.map((msg) => ({
            ...msg,
            isMe: msg.senderId === myStore.id,
          }));
          return { ...prev, [storeId]: formattedHistory };
        });
      }
    }
    loadHistory();

    // 1. [채팅 중복 렌더링 버그 수정] 실시간 소켓 수신 시 자가 송신 메시지 중복 필터링
    const unsubscribe = subscribeToTradeChat(storeId, (newMsg) => {
      if (newMsg.senderId === myStore.id) return;

      setMessagesMap((prev) => ({
        ...prev,
        [storeId]: [...(prev[storeId] || []), { ...newMsg, isMe: false }],
      }));
    });

    return () => unsubscribe();
  }, [chatTargetStore, myStore.id]);

  const handleLoginSuccess = async (ownerName: string, storeName: string, registeredStore?: Store) => {
    setIsLoggedIn(true);
    setUserOwnerName(ownerName);

    let finalStore = registeredStore;
    // registeredStore가 넘어왔더라도 exchangeItems가 비어있다면 Supabase에서 최신 품목들을 가져와 합체
    if (!finalStore || !finalStore.exchangeItems || finalStore.exchangeItems.length === 0) {
      const freshUserStore = await fetchUserStoreFromSupabase();
      if (freshUserStore) {
        finalStore = freshUserStore;
      }
    }

    if (finalStore) {
      setMyStore(finalStore);
      if (finalStore.lat && finalStore.lng) {
        setPickedLocation({ lat: finalStore.lat, lng: finalStore.lng });
      }
      setStores((prevStores) => {
        const exists = prevStores.some((s) => s.id === finalStore!.id);
        if (exists) {
          return prevStores.map((s) => (s.id === finalStore!.id ? finalStore! : s));
        }
        return [finalStore!, ...prevStores];
      });
      try {
        localStorage.setItem('trademe_my_store', JSON.stringify(finalStore));
        localStorage.setItem(
          'trademe_profile',
          JSON.stringify({
            id: finalStore.userId,
            user_id: finalStore.userId,
            owner_name: ownerName,
            store_name: storeName,
          })
        );
      } catch (e) {}
      return;
    }

    setMyStore((prev) => ({ ...prev, ownerName, storeName }));
  };

  const handleToggleBreakTime = () => {
    if (!isLoggedIn) {
      setAuthModalNotice('💡 내 가게 교환 가능 설정은 사장님 로그인이 필요한 서비스입니다.');
      setIsAuthModalOpen(true);
      return;
    }

    const updatedStatus = !myStore.breakTimeActive;
    const updatedMyStore = { ...myStore, breakTimeActive: updatedStatus };
    setMyStore(updatedMyStore);

    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );

    // Save to localStorage so state persists immediately across page refreshes
    try {
      localStorage.setItem('trademe_my_store', JSON.stringify(updatedMyStore));
    } catch (e) {}

    updateStoreStatusInSupabase(myStore.id, updatedStatus, myStore.userId);
  };

  const handleMapClickPinLocation = (lat: number, lng: number) => {
    setPickedLocation({ lat, lng });
  };

  const handleRegisterNewStoreAndItems = (newStore: Store) => {
    setMyStore(newStore);
    setStores((prevStores) => [newStore, ...prevStores]);
    setSelectedStore(newStore);
  };

  const handleOpenProposal = (targetItem: ExchangeItem) => {
    if (!isLoggedIn) {
      setAuthModalNotice('💡 1:1 물물교환 제안은 사장님 로그인이 필요한 서비스입니다. 지금 로그인하거나 3초 만에 회원가입해 보세요!');
      setIsAuthModalOpen(true);
      return;
    }
    setTargetProposalItem(targetItem);
    setIsProposalModalOpen(true);
  };

  const handleSendProposal = (
    myMenu: ExchangeItem,
    targetMenu: ExchangeItem,
    diffPrice: number,
    pickupTime: string,
    isPoke: boolean = false,
    memoMessage: string = '',
    tradeType: 'VOUCHER' | 'DIRECT' = 'VOUCHER',
    tradeFulfillment: string = '🎟️ 상생 교환권(모바일 쿠폰) 즉시 맞발행'
  ) => {
    if (!selectedStore) return;

    const diffText =
      diffPrice === 0
        ? '차액 0원 (동일가 교환)'
        : diffPrice > 0
        ? `내가 ${diffPrice.toLocaleString()}원 현장 추가정산`
        : `상대가 ${Math.abs(diffPrice).toLocaleString()}원 현장 추가정산`;

    const storeId = selectedStore.id;

    // Send proposal record to Supabase DB trades table & LocalStorage
    sendTradeProposalToSupabase(
      myStore.id,
      storeId,
      myMenu.id,
      targetMenu.id,
      diffPrice,
      pickupTime,
      isPoke,
      memoMessage,
      {
        myStoreName: myStore.storeName,
        myOwnerName: myStore.ownerName,
        myItemTitle: myMenu.title,
        myItemImageUrl: myMenu.imageUrl,
        myItemPrice: myMenu.estimatedPrice,
        targetStoreName: selectedStore.storeName,
        targetOwnerName: selectedStore.ownerName,
        targetItemTitle: targetMenu.title,
        targetItemImageUrl: targetMenu.imageUrl,
        targetItemPrice: targetMenu.estimatedPrice,
        tradeType,
        tradeFulfillment,
      }
    );

    // If it's a REALTIME exchange proposal (!isPoke), open chat and send proposal bubble
    // If it's a POKE (isPoke === true), send asynchronously without intrusive chat popup
    if (!isPoke) {
      const proposalMsgText = `[1:1 물물교환 제안]\n제공 품목: ${myMenu.title} (${myMenu.estimatedPrice.toLocaleString()}원)\n희망 품목: ${targetMenu.title} (${targetMenu.estimatedPrice.toLocaleString()}원)\n이용 방식: ${tradeFulfillment}\n정산: ${diffText}\n희망 시각: ${pickupTime}${memoMessage ? `\n메모: ${memoMessage}` : ''}`;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: myStore.id,
        senderName: myStore.ownerName,
        message: proposalMsgText,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        systemAction: 'PROPOSAL',
      };

      // Send proposal chat message to Supabase DB chat_messages table
      sendChatMessageToSupabase(storeId, myStore.id, myStore.ownerName, proposalMsgText);

      setMessagesMap((prev) => ({
        ...prev,
        [storeId]: [...(prev[storeId] || []), newMsg],
      }));

      setChatTargetStore(selectedStore);
      setIsChatDrawerOpen(true);
    } else {
      alert(`👉 [${selectedStore.storeName}] 사장님께 조용히 '비동기 찔러보기' 제안서를 전달했습니다!\n상대 사장님이 여유가 되실 때 제안함에서 확인 및 수락하실 수 있습니다.`);
    }
  };

  const handleAcceptTradeProposalAndOpenChat = (proposal: TradeProposal) => {
    refreshVoucherWalletCount();

    const counterpartStoreId = proposal.myStoreId === myStore.id ? proposal.targetStoreId : proposal.myStoreId;
    const counterpartStore = stores.find((s) => s.id === counterpartStoreId) || {
      id: counterpartStoreId,
      ownerName: (proposal.myStoreId === myStore.id ? proposal.targetOwnerName : proposal.myOwnerName) || '이웃 사장님',
      storeName: (proposal.myStoreId === myStore.id ? proposal.targetStoreName : proposal.myStoreName) || '이웃 매장',
      category: 'FOOD',
      categoryName: '외식업',
      address: '인근 이웃 매장',
      lat: myStore.lat + 0.001,
      lng: myStore.lng + 0.001,
      phone: '010-0000-0000',
      isVerified: true,
      breakTimeActive: true,
      breakTimeHours: '10:00 - 22:00',
      storeImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      exchangeItems: [],
      rating: 5.0,
      reviewCount: 1,
    };

    setChatTargetStore(counterpartStore);
    setIsChatDrawerOpen(true);

    const myItemTitle = proposal.myStoreId === myStore.id ? proposal.myItemTitle : proposal.targetItemTitle;
    const counterpartItemTitle = proposal.myStoreId === myStore.id ? proposal.targetItemTitle : proposal.myItemTitle;

    const acceptText = `🤝 [${myStore.storeName}] 사장님께서 제안하신 1:1 물물교환을 수락하셨습니다!\n🎟️ 양측 매장의 상생 교환권이 보관함으로 상호 자동 발급되었습니다.\n• [${myStore.storeName}] 제공: ${myItemTitle || '상생 교환 품목'}\n• [${counterpartStore.storeName}] 제공: ${counterpartItemTitle || '상생 교환 품목'}\n📅 유효기간: 오늘부터 30일간 (내 교환권 보관함에서 슬라이드하여 사용 가능)`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: acceptText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      systemAction: 'ACCEPT',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [counterpartStore.id]: [...(prev[counterpartStore.id] || []), newMsg],
    }));

    sendChatMessageToSupabase(counterpartStore.id, myStore.id, myStore.ownerName, acceptText);
  };

  const handleOpenChat = (store: Store) => {
    if (!isLoggedIn) {
      setAuthModalNotice(`💡 [${store.storeName}] 사장님과의 1:1 대화는 로그인이 필요한 서비스입니다. 지금 로그인하거나 3초 만에 회원가입해 보세요!`);
      setIsAuthModalOpen(true);
      return;
    }
    setChatTargetStore(store);
    setIsChatDrawerOpen(true);
  };

  const handleSendChatMessage = (text: string) => {
    if (!chatTargetStore) return;
    const storeId = chatTargetStore.id;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), newMsg],
    }));

    sendChatMessageToSupabase(storeId, myStore.id, myStore.ownerName, text);
  };

  const filteredStores = stores.filter((store) => {
    if (onlyBreakTime && !store.breakTimeActive) return false;
    if (onlyMenuTesting && !store.isMenuTesting) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FOOD') return ['KOREAN', 'JAPANESE', 'WESTERN', 'CHINESE', 'SNACK', 'CAFE', 'PUB'].includes(store.category);
    if (selectedCategory === 'RETAIL') return ['CONVENIENCE', 'BAKERY', 'FRESH_FOOD'].includes(store.category);
    if (selectedCategory === 'BEAUTY') return store.category === 'BEAUTY';
    if (selectedCategory === 'ACCOMMODATION') return ['ACCOMMODATION', 'LEISURE'].includes(store.category);
    if (selectedCategory === 'SERVICE') return ['LAUNDRY', 'FITNESS', 'OTHER'].includes(store.category);
    return true;
  });

  const menuTestingStoreCount = stores.filter((s) => s.isMenuTesting).length;

  const handleUpdateProfile = (
    ownerName: string,
    storeName: string,
    phone: string,
    businessNumber?: string,
    storeImageUrl?: string,
    address?: string,
    breakTimeHours?: string,
    category?: string,
    lat?: number,
    lng?: number
  ) => {
    setUserOwnerName(ownerName);
    const updatedMyStore: Store = {
      ...myStore,
      ownerName,
      storeName,
      phone: phone || myStore.phone,
      storeImageUrl: storeImageUrl || myStore.storeImageUrl,
      ...(address ? { address } : {}),
      ...(breakTimeHours ? { breakTimeHours } : {}),
      ...(category ? { category: category as any } : {}),
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
    };

    if (lat && lng) {
      setPickedLocation({ lat, lng });
    }

    setMyStore(updatedMyStore);
    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );

    saveProfileToSupabase(
      ownerName,
      storeName,
      phone,
      businessNumber,
      storeImageUrl,
      address,
      breakTimeHours,
      category,
      lat,
      lng,
      myStore.id,
      myStore.userId
    );

    try {
      const existingProfile = localStorage.getItem('trademe_profile');
      const profileObj = existingProfile ? JSON.parse(existingProfile) : {};
      localStorage.setItem(
        'trademe_profile',
        JSON.stringify({
          ...profileObj,
          id: profileObj.id || myStore.userId,
          owner_name: ownerName,
          ownerName,
          store_name: storeName,
          storeName,
          phone: phone || profileObj.phone,
          business_number: businessNumber || profileObj.business_number || profileObj.businessNumber,
          businessNumber: businessNumber || profileObj.businessNumber,
          store_image_url: storeImageUrl || profileObj.store_image_url || profileObj.storeImageUrl,
          storeImageUrl: storeImageUrl || profileObj.storeImageUrl,
          address: address || profileObj.address,
          break_time_hours: breakTimeHours,
          breakTimeHours,
          operating_hours: breakTimeHours,
        })
      );
      localStorage.setItem('trademe_my_store', JSON.stringify(updatedMyStore));
    } catch (e) {}
  };

  const handleSaveExchangeItems = (updatedItems: ExchangeItem[], extraStoreProps?: Partial<Store>) => {
    const updatedMyStore: Store = {
      ...myStore,
      ...extraStoreProps,
      exchangeItems: updatedItems,
    };
    setMyStore(updatedMyStore);
    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );
    try {
      localStorage.setItem('trademe_my_store', JSON.stringify(updatedMyStore));
    } catch (e) {}
  };

  const handleSaveMenuTest = (updatedFields: Partial<Store>) => {
    const updatedMyStore: Store = {
      ...myStore,
      ...updatedFields,
    };
    setMyStore(updatedMyStore);
    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );
    try {
      localStorage.setItem('trademe_my_store', JSON.stringify(updatedMyStore));
    } catch (e) {}
  };

  const handleLogout = async () => {
    await signOutUser();
    setIsLoggedIn(false);
    setUserOwnerName('');
    setMyStore(INITIAL_EMPTY_STORE_STATE);
    try {
      localStorage.removeItem('trademe_profile');
      localStorage.removeItem('trademe_my_store');
    } catch (e) {}
  };

  const handleAcceptMenuTestAndOpenChat = (applicant: MenuTestApplication) => {
    // 1. Resolve or construct applicant store for 1:1 chat
    const existingStore = stores.find(
      (s) => s.storeName === applicant.applicantStoreName || s.ownerName === applicant.applicantOwnerName
    );

    const applicantTargetStore: Store = existingStore || {
      id: applicant.applicantUserId || `store-applicant-${applicant.id}`,
      ownerName: applicant.applicantOwnerName,
      storeName: applicant.applicantStoreName,
      category: 'FOOD',
      categoryName: '외식/서비스',
      address: '인근 이웃 매장',
      lat: myStore.lat + 0.0015,
      lng: myStore.lng + 0.0015,
      phone: applicant.applicantPhone,
      isVerified: true,
      breakTimeActive: true,
      breakTimeHours: '10:00 - 22:00',
      storeImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      exchangeItems: [],
      rating: 5.0,
      reviewCount: 1,
    };

    // 2. Open Chat Drawer with this applicant
    setChatTargetStore(applicantTargetStore);
    setIsChatDrawerOpen(true);

    // 3. Send automated acceptance congratulation message
    const welcomeText = `🎉 축하합니다! [${myStore.menuTestTitle || '신메뉴'}] 1호 시식단으로 최종 선정되셨습니다! 편하신 방문 일시와 동반 인원을 조율해 주세요.`;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: welcomeText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      systemAction: 'ACCEPT',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [applicantTargetStore.id]: [...(prev[applicantTargetStore.id] || []), newMsg],
    }));

    sendChatMessageToSupabase(applicantTargetStore.id, myStore.id, myStore.ownerName, welcomeText);
  };

  const hasRegisteredStore = isLoggedIn && !!myStore?.storeName && myStore.storeName !== '로그인 필요';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Navbar with Auth & Break Time Toggle */}
      <Navbar
        myBreakTimeActive={myStore.breakTimeActive}
        onToggleBreakTime={handleToggleBreakTime}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTradeDashboard={() => setIsTradeDashboardOpen(true)}
        onOpenMenuTestDashboard={() => setIsMenuTestDashboardOpen(true)}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onlyBreakTime={onlyBreakTime}
        onToggleOnlyBreakTime={() => setOnlyBreakTime(!onlyBreakTime)}
        onlyMenuTesting={onlyMenuTesting}
        onToggleOnlyMenuTesting={() => setOnlyMenuTesting(!onlyMenuTesting)}
        menuTestingStoreCount={menuTestingStoreCount}
        storeCount={filteredStores.length}
        hasRegisteredStore={hasRegisteredStore}
        pendingAlertCount={pendingTradeCount + pendingMenuTestCount}
        onOpenCommunityModal={() => setIsCommunityModalOpen(true)}
        onOpenCouponWallet={() => {
          refreshVoucherWalletCount();
          setIsCouponWalletOpen(true);
        }}
        voucherCount={voucherWalletCount}
      />

      {/* Main Map View */}
      <main className="relative flex-1">
        <NaverMapView
          stores={filteredStores}
          selectedStore={selectedStore}
          onSelectStore={(store) => setSelectedStore(store)}
          myStore={myStore}
          pickedLocation={pickedLocation}
          onMapClickPinLocation={handleMapClickPinLocation}
        />

        {/* Map Location Click Hint Pill */}
        <div className="hidden md:flex absolute top-4 right-4 z-20 bg-white/90 backdrop-blur px-3.5 py-2 rounded-xl shadow-lg border border-orange-200 text-xs font-bold text-orange-900 items-center gap-1.5 animate-bounce">
          <MapPin className="w-4 h-4 text-orange-600" />
          <span>💡 상단 [물물교환 품목 등록]에서 도로명 주소로 위치를 조율하세요</span>
        </div>

        {/* Selected Store Detail & Exchange Items Drawer */}
        <StoreDetailDrawer
          store={selectedStore?.id === myStore.id ? myStore : selectedStore}
          onClose={() => setSelectedStore(null)}
          onOpenProposal={handleOpenProposal}
          onOpenChat={handleOpenChat}
          onOpenMenuTestApply={(store, campaign) => {
            if (!isLoggedIn) {
              setAuthModalNotice(`💡 [${store.storeName}] 신메뉴 시식단 신청은 로그인이 필요한 서비스입니다. 지금 로그인하거나 3초 만에 회원가입해 보세요!`);
              setIsAuthModalOpen(true);
              return;
            }
            setTargetMenuTestStore(store);
            setTargetMenuTestCampaign(campaign || null);
            setIsMenuTestModalOpen(true);
          }}
          onOpenMenuTestDashboard={() => setIsMenuTestDashboardOpen(true)}
          isMyStore={selectedStore?.id === myStore.id}
        />

        {/* 🌟 비로그인 첫 방문 상생 웰컴 플로팅 카드 */}
        {!isLoggedIn && showWelcomeCard && (
          <aside aria-label="Welcome Card" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-200/90 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                  🤝
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-snug tracking-tight">
                  우리 동네 사장님들의 가치 있는 물물교환, Trade Me!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWelcomeCard(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                title="배너 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium mt-2 leading-relaxed sm:pl-11">
              정성껏 준비한 우리 가게 메뉴와 서비스를 이웃 매장과 교류해보세요
            </p>

            <div className="mt-3.5 flex items-center gap-2 sm:pl-11">
              <button
                type="button"
                onClick={() => {
                  setAuthModalNotice(null);
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <span>사장님 3초 가입 / 로그인</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowWelcomeCard(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all whitespace-nowrap active:scale-[0.98]"
              >
                동네 둘러보기
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* Auth / MyPage Modal (사장님 프로필 & 대시보드 올인원 허브) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalNotice(null);
        }}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        userStoreName={myStore.storeName}
        myStore={myStore}
        noticeMessage={authModalNotice}
        onLoginSuccess={handleLoginSuccess}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onOpenManageItems={() => setIsManageItemsModalOpen(true)}
        onOpenCouponWallet={() => {
          refreshVoucherWalletCount();
          setIsCouponWalletOpen(true);
        }}
        voucherCount={voucherWalletCount}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenTradeDashboard={() => setIsTradeDashboardOpen(true)}
        onOpenMenuTestDashboard={() => setIsMenuTestDashboardOpen(true)}
        pendingTradeCount={pendingTradeCount}
        pendingMenuTestCount={pendingMenuTestCount}
      />

      {/* 🍱 1:1 물물교환 대표 품목 직행 관리 모달 (Step 2 단독) */}
      <ManageExchangeItemsModal
        isOpen={isManageItemsModalOpen}
        onClose={() => setIsManageItemsModalOpen(false)}
        myStore={myStore}
        onSaveItems={handleSaveExchangeItems}
      />

      {/* 🎟️ 내 교환권 보관함 모달 (Phase 3) */}
      <CouponWalletModal
        isOpen={isCouponWalletOpen}
        onClose={() => {
          refreshVoucherWalletCount();
          setIsCouponWalletOpen(false);
        }}
        myStore={myStore}
        onWalletUpdate={refreshVoucherWalletCount}
        onExploreStores={() => {
          setIsCouponWalletOpen(false);
        }}
      />

      {/* Register Store & Exchange Items Modal (Legacy/Direct) */}
      <RegisterStoreAndItemsModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterNewStoreAndItems}
        currentOwnerName={userOwnerName}
        pickedLat={pickedLocation.lat}
        pickedLng={pickedLocation.lng}
        onUpdatePickedLocation={(lat, lng) => setPickedLocation({ lat, lng })}
      />

      {/* 🧪 Menu Test Application Modal */}
      <MenuTestApplyModal
        isOpen={isMenuTestModalOpen}
        onClose={() => setIsMenuTestModalOpen(false)}
        targetStore={targetMenuTestStore}
        targetCampaign={targetMenuTestCampaign}
        applicantOwnerName={userOwnerName}
        applicantStoreName={myStore.storeName}
        applicantPhone={myStore.phone}
        onSuccess={() => {
          fetchStoresFromSupabase().then((data) => {
            if (data && data.length > 0) setStores(data);
          });
        }}
      />

      {/* 🧪 Menu Test Dashboard Modal (신청서 접수 관리 및 이벤트 목록 - 최대 2개 동시 모집) */}
      <MenuTestDashboardModal
        isOpen={isMenuTestDashboardOpen}
        onClose={() => setIsMenuTestDashboardOpen(false)}
        myStore={myStore}
        onAcceptAndOpenChat={handleAcceptMenuTestAndOpenChat}
        onOpenRegisterMenuTest={(campaignToEdit, activeCount) => {
          setEditingCampaign(campaignToEdit || null);
          setRegisterActiveCampaignCount(activeCount || 0);
          setIsRegisterMenuTestModalOpen(true);
        }}
        refreshTrigger={menuTestRefreshTrigger}
      />

      {/* 🧪 Register Menu Test Recruitment Modal (신메뉴 모집 단독 폼) */}
      <RegisterMenuTestModal
        isOpen={isRegisterMenuTestModalOpen}
        onClose={() => {
          setIsRegisterMenuTestModalOpen(false);
          setEditingCampaign(null);
        }}
        myStore={myStore}
        editingCampaign={editingCampaign}
        activeCampaignCount={registerActiveCampaignCount}
        onSaveCampaign={(savedCampaign) => {
          setMyStore((prev) => ({
            ...prev,
            isMenuTesting: savedCampaign.status === 'RECRUITING',
            menuTestTitle: savedCampaign.title,
            menuTestReward: savedCampaign.reward,
            menuTestQuota: savedCampaign.quota,
            menuTestFeedbackType: savedCampaign.feedbackType,
            menuTestImageUrl: savedCampaign.imageUrl,
          }));
          setMenuTestRefreshTrigger((prev) => prev + 1);
          fetchStoresFromSupabase().then((data) => {
            if (data && data.length > 0) setStores(data);
          });
        }}
      />

      {/* 🤝 1:1 Trade Proposal Dashboard Modal (교환 제안함 대시보드) */}
      <TradeDashboardModal
        isOpen={isTradeDashboardOpen}
        onClose={() => setIsTradeDashboardOpen(false)}
        myStore={myStore}
        allStores={stores}
        onAcceptAndOpenChat={handleAcceptTradeProposalAndOpenChat}
        onOpenChat={handleOpenChat}
      />

      {/* 1:1 Equivalent Exchange Proposal Modal */}
      {selectedStore && targetProposalItem && (
        <TradeProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          targetStore={selectedStore}
          targetItem={targetProposalItem}
          myStore={myStore}
          onSendProposal={handleSendProposal}
        />
      )}

      {/* 1:1 Chat Negotiation Drawer */}
      <ChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        targetStore={chatTargetStore}
        myStore={myStore}
        messages={chatTargetStore ? messagesMap[chatTargetStore.id] || [] : []}
        onSendMessage={handleSendChatMessage}
        onOpenCouponWallet={() => setIsCouponWalletOpen(true)}
      />

      {/* ☕ 사장님 사랑방 커뮤니티 모달 */}
      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        myStore={myStore}
        userOwnerName={userOwnerName}
        stores={stores}
        onOpenProposalForStore={(targetStore, urgentItem) => {
          setIsCommunityModalOpen(false);
          setSelectedStore(targetStore);
          if (targetStore.exchangeItems && targetStore.exchangeItems.length > 0) {
            setTargetProposalItem(targetStore.exchangeItems[0]);
            setIsProposalModalOpen(true);
          }
        }}
        onOpenChatForStore={(targetStore) => {
          setIsCommunityModalOpen(false);
          handleOpenChat(targetStore);
        }}
      />

    </div>
  );
};

export default App;
