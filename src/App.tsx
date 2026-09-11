import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { MapView } from './components/MapView';
import { NaverMapView } from './components/NaverMapView';
import { StoreDetailDrawer } from './components/StoreDetailDrawer';
import { RegisterStoreAndItemsModal } from './components/RegisterStoreAndItemsModal';
import { TradeProposalModal } from './components/TradeProposalModal';
import { ChatDrawer } from './components/ChatDrawer';
import { ChatListModal } from './components/ChatListModal';
import { AuthModal } from './components/AuthModal';
import { MenuTestApplyModal } from './components/MenuTestApplyModal';
import { MenuTestDashboardModal } from './components/MenuTestDashboardModal';
import { RegisterMenuTestModal } from './components/RegisterMenuTestModal';
import { ManageExchangeItemsModal } from './components/ManageExchangeItemsModal';
import { TradeDashboardModal } from './components/TradeDashboardModal';
import { CommunityModal } from './components/CommunityModal';
import { CouponWalletModal } from './components/CouponWalletModal';
import { Footer } from './components/Footer';
import { WebmasterAuthModal } from './components/WebmasterAuthModal';
import { WebmasterDashboardModal } from './components/WebmasterDashboardModal';
import { InquiryModal } from './components/InquiryModal';
import { TermsOfServiceModal, PrivacyPolicyModal } from './components/LegalModals';
import { TopMainSlimBanner } from './components/CoupangAffiliateBanner';
import { InquiryType } from './types/trade';
import {
  fetchStoresFromSupabase,
  subscribeToTradeChat,
  subscribeToIncomingChats,
  subscribeToTradeProposals,
  subscribeToVouchers,
  sendChatMessageToSupabase,
  sendTradeProposalToSupabase,
  fetchTradeProposalsFromSupabase,
  updateTradeProposalStatus,
  issueBilateralVouchersForTrade,
  fetchMenuTestApplications,
  fetchChatHistory,
  fetchMyChatConversations,
  deleteChatConversation,
  saveProfileToSupabase,
  updateStoreStatusInSupabase,
  fetchUserProfileFromSupabase,
  fetchUserStoreFromSupabase,
  signOutUser,
  fetchStoredVouchers,
  fetchVouchersFromSupabase,
  isDummyTradeProposal,
  getDeletedProposalIds,
  supabase,
} from './lib/supabase';
import { Store, ExchangeItem, TradeProposal, ChatMessage, ChatConversationSummary, MenuTestApplication, MenuTestCampaign } from './types/trade';
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
  const [voucherWalletCount, setVoucherWalletCount] = useState<number>(0);

  const refreshVoucherWalletCount = () => {
    if (!myStore?.id || myStore.id === 'my_store') {
      setVoucherWalletCount(0);
      return;
    }
    try {
      const vs = fetchStoredVouchers(myStore.id, myStore.storeName);
      setVoucherWalletCount(vs.filter((v) => v.status === 'AVAILABLE').length);
      fetchVouchersFromSupabase(myStore.id).then((cloudVs) => {
        if (cloudVs) {
          setVoucherWalletCount(cloudVs.filter((v) => v.status === 'AVAILABLE').length);
        }
      });
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
  const [isTradeDashboardOpen, setIsTradeDashboardOpen] = useState(false);
  const [tradeDashboardTab, setTradeDashboardTab] = useState<'RECEIVED' | 'SENT' | 'MY_APPLICATIONS'>('RECEIVED');

  const handleOpenTradeDashboard = (tab: 'RECEIVED' | 'SENT' | 'MY_APPLICATIONS' = 'RECEIVED') => {
    setTradeDashboardTab(tab);
    setIsTradeDashboardOpen(true);
  };

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
  const [isChatListModalOpen, setIsChatListModalOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [incomingChatAlert, setIncomingChatAlert] = useState<{
    counterpartStore: Store;
    senderName: string;
    message: string;
  } | null>(null);

  // 👑 Webmaster, Footer Inquiries, and Legal Modals state
  const [isWebmasterAuthOpen, setIsWebmasterAuthOpen] = useState(false);
  const [isWebmasterDashboardOpen, setIsWebmasterDashboardOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryDefaultType, setInquiryDefaultType] = useState<InquiryType>('INQUIRY');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [bannedStoreIds, setBannedStoreIds] = useState<string[]>([]);

  const handleOpenInquiry = (type: InquiryType) => {
    setInquiryDefaultType(type);
    setIsInquiryModalOpen(true);
  };

  const handleToggleStoreBan = (storeId: string) => {
    setBannedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  // 🧪 Automation Test Hooks for Browser Verification
  useEffect(() => {
    (window as any).__testSetSelectedStore = (s: Store | null) => setSelectedStore(s);
    (window as any).__testOpenTradeDashboard = () => setIsTradeDashboardOpen(true);
    (window as any).__testOpenCouponWallet = () => { setIsCouponWalletOpen(true); setMobileActiveTab('WALLET'); };
    (window as any).__testOpenChatListModal = () => { setIsChatListModalOpen(true); setMobileActiveTab('CHAT'); };
    (window as any).__testOpenCommunityModal = () => { setIsCommunityModalOpen(true); setMobileActiveTab('COMMUNITY'); };
    (window as any).__testOpenAuthModal = () => { setIsAuthModalOpen(true); setMobileActiveTab('MY_STORE'); };
    (window as any).__testCloseAllModals = () => {
      setIsChatListModalOpen(false);
      setIsCommunityModalOpen(false);
      setIsCouponWalletOpen(false);
      setIsAuthModalOpen(false);
      setSelectedStore(null);
      setMobileActiveTab('MAP');
    };
  }, []);

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
          if (cachedVouchers) {
            const parsed = JSON.parse(cachedVouchers);
            const filtered = parsed.filter(
              (v: any) =>
                !v.id?.startsWith('voucher-seed-') &&
                !v.tradeId?.startsWith('trade-demo-') &&
                v.receiverStoreId !== 'my_store' &&
                Boolean(v.receiverStoreId) &&
                !['소담 한정식', '헤어살롱 유', '달콤 베이커리', '트레이드미 테스트 베이커리'].includes(v.senderStoreName)
            );
            if (filtered.length !== parsed.length) {
              localStorage.setItem('trademe_vouchers', JSON.stringify(filtered));
            }
          }
        } catch (e) {}

        // Clean up any legacy dummy trade proposals cache
        try {
          const cachedProposals = localStorage.getItem('trademe_trade_proposals');
          if (cachedProposals) {
            const parsed = JSON.parse(cachedProposals);
            const deletedIds = getDeletedProposalIds();
            const filtered = parsed.filter((p: any) =>
              !deletedIds.has(p.id) &&
              !isDummyTradeProposal(p) &&
              !['소담 한정식', '헤어살롱 유', '달콤 베이커리', '트레이드미 테스트 베이커리'].includes(p.myStoreName) &&
              !['소담 한정식', '헤어살롱 유', '달콤 베이커리', '트레이드미 테스트 베이커리'].includes(p.targetStoreName)
            );
            if (filtered.length !== parsed.length) {
              localStorage.setItem('trademe_trade_proposals', JSON.stringify(filtered));
            }
          }
        } catch (e) {}

        // Clean up any legacy dummy chats cache
        try {
          const cachedChats = localStorage.getItem('trademe_local_chats');
          if (cachedChats) {
            const parsed = JSON.parse(cachedChats);
            const filtered = parsed.filter((m: any) =>
              !['소담 한정식', '헤어살롱 유', '달콤 베이커리', '트레이드미 테스트 베이커리'].includes(m.sender_name) &&
              !['소담 한정식', '헤어살롱 유', '달콤 베이커리', '트레이드미 테스트 베이커리'].includes(m.senderName) &&
              m.sender_store_id !== 'store-webmaster-test-bakery'
            );
            if (filtered.length !== parsed.length) {
              localStorage.setItem('trademe_local_chats', JSON.stringify(filtered));
            }
          }
        } catch (e) {}

        // Clean up test admin user session if cached
        try {
          const savedStore = localStorage.getItem('trademe_my_store');
          if (savedStore && (savedStore.includes('store-webmaster-test-bakery') || savedStore.includes('테스트 베이커리'))) {
            localStorage.removeItem('trademe_my_store');
            localStorage.removeItem('trademe_profile');
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

  // Supabase Realtime Chat Subscription & Past History Loader (양방향 대화 완벽 지원)
  useEffect(() => {
    if (!chatTargetStore) return;

    const storeId = chatTargetStore.id;

    // 2. [초기 데이터 로딩 최적화] 양방향 과거 채팅 내역 Supabase에서 불러오기
    async function loadHistory() {
      const history = await fetchChatHistory(storeId, myStore.id);
      if (history && history.length > 0) {
        setMessagesMap((prev) => ({
          ...prev,
          [storeId]: history,
        }));
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

  // 💬 [1:1 대화함] 내 매장의 모든 대화방 목록 동기화
  const refreshConversations = async () => {
    if (!myStore.id) return;
    const list = await fetchMyChatConversations(myStore.id, stores);
    setConversations(list);
  };

  const handleDeleteConversation = async (counterpartStoreId: string) => {
    if (!myStore.id) return;
    await deleteChatConversation(counterpartStoreId, myStore.id);
    setConversations((prev) => prev.filter((c) => c.counterpartStoreId !== counterpartStoreId));
    if (chatTargetStore?.id === counterpartStoreId) {
      setIsChatDrawerOpen(false);
      setChatTargetStore(null);
    }
  };

  useEffect(() => {
    refreshConversations();
    const interval = setInterval(refreshConversations, 5000);
    return () => clearInterval(interval);
  }, [myStore.id, stores.length]);

  // 🔔 [실시간 1:1 메시지 수신 리스너]
  useEffect(() => {
    if (!myStore.id) return;

    const unsubscribe = subscribeToIncomingChats(myStore.id, (data) => {
      refreshConversations();

      // 🎟️ 상대방이 물물교환 제안을 수락한 경우 실시간으로 내 보관함 및 제안 상태 즉각 동기화
      if (data.rawMsg.systemAction === 'ACCEPT' || (data.message && data.message.includes('수락하셨습니다'))) {
        fetchVouchersFromSupabase(myStore.id).then(() => {
          refreshVoucherWalletCount();
        });
        fetchTradeProposalsFromSupabase(myStore.id).then(() => {
          refreshPendingAlertCounts();
        });
      }

      // 현재 열려있는 대화방이면 말풍선 바로 추가
      if (chatTargetStore?.id === data.counterpartStoreId) {
        setMessagesMap((prev) => ({
          ...prev,
          [data.counterpartStoreId]: [...(prev[data.counterpartStoreId] || []), data.rawMsg],
        }));
      } else {
        // 아니면 상단에 실시간 알림 토스트 팝업
        const senderStore = stores.find((s) => s.id === data.counterpartStoreId) || {
          id: data.counterpartStoreId,
          ownerName: data.senderName,
          storeName: data.senderName + ' 매장',
          category: 'FOOD' as any,
          categoryName: '외식업',
          address: '인근 이웃 매장',
          lat: myStore.lat || 35.318,
          lng: myStore.lng || 129.006,
          phone: '',
          isVerified: true,
          breakTimeActive: true,
          breakTimeHours: '10:00 - 22:00',
          storeImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          exchangeItems: [],
          rating: 5.0,
          reviewCount: 1,
        };

        setIncomingChatAlert({
          counterpartStore: senderStore,
          senderName: data.senderName,
          message: data.message,
        });

        setTimeout(() => {
          setIncomingChatAlert((current) => (current?.message === data.message ? null : current));
        }, 8000);
      }
    });

    return () => unsubscribe();
  }, [myStore.id, chatTargetStore?.id, stores]);

  // 🤝 [실시간 물물교환 제안 & 상생 교환권 클라우드 동기화 리스너]
  useEffect(() => {
    if (!myStore.id || myStore.id === 'my_store') {
      setVoucherWalletCount(0);
      return;
    }

    refreshVoucherWalletCount();

    // 접속 시 클라우드 보관함 자동 초기 동기화
    fetchVouchersFromSupabase(myStore.id).then(() => {
      refreshVoucherWalletCount();
    });

    // 실시간 제안 상태 변경(수락/거절) 감지
    const unsubProposals = subscribeToTradeProposals(myStore.id, () => {
      fetchTradeProposalsFromSupabase(myStore.id).then(() => {
        refreshPendingAlertCounts();
      });
      fetchVouchersFromSupabase(myStore.id).then(() => {
        refreshVoucherWalletCount();
      });
    });

    // 실시간 교환권 발행 감지
    const unsubVouchers = subscribeToVouchers(myStore.id, () => {
      fetchVouchersFromSupabase(myStore.id).then(() => {
        refreshVoucherWalletCount();
      });
    });

    return () => {
      unsubProposals();
      unsubVouchers();
    };
  }, [myStore.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__testSetSelectedStore = setSelectedStore;
      (window as any).__testOpenChat = handleOpenChat;
    }
  }, []);

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

  const handleSendProposal = async (
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
    const res = await sendTradeProposalToSupabase(
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

    const tradeId = res?.tradeId || `trade-${Date.now()}`;

    // Invisible structured data for ChatDrawer parsing & state management
    const tradeDataPayload = {
      tradeId,
      myStoreId: myStore.id,
      targetStoreId: storeId,
      myStoreName: myStore.storeName,
      myOwnerName: myStore.ownerName,
      targetStoreName: selectedStore.storeName,
      targetOwnerName: selectedStore.ownerName,
      myItemTitle: myMenu.title,
      myItemPrice: myMenu.estimatedPrice,
      myItemImageUrl: myMenu.imageUrl,
      targetItemTitle: targetMenu.title,
      targetItemPrice: targetMenu.estimatedPrice,
      targetItemImageUrl: targetMenu.imageUrl,
      diffText,
      tradeFulfillment,
      pickupTime,
      memoMessage,
      tradeType,
      isPoke,
    };

    const proposalMsgText = `<!--TRADE_DATA:${JSON.stringify(tradeDataPayload)}-->[1:1 물물교환 제안]\n제공 품목: ${myMenu.title} (${myMenu.estimatedPrice.toLocaleString()}원)\n희망 품목: ${targetMenu.title} (${targetMenu.estimatedPrice.toLocaleString()}원)\n이용 방식: ${tradeFulfillment}\n정산: ${diffText}\n희망 시각: ${pickupTime}${memoMessage ? `\n메모: ${memoMessage}` : ''}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: proposalMsgText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      systemAction: 'PROPOSAL',
    };

    // Send proposal chat message to Supabase DB chat_messages table & LocalStorage
    await sendChatMessageToSupabase(storeId, myStore.id, myStore.ownerName, proposalMsgText);

    setMessagesMap((prev) => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), newMsg],
    }));

    setChatTargetStore(selectedStore);
    setIsChatDrawerOpen(true);
    refreshPendingAlertCounts();
  };

  const handleAcceptTradeFromChat = async (tradeData?: any) => {
    if (!chatTargetStore) return;
    const counterpartStore = chatTargetStore;

    // 1. Build or retrieve proposal object
    let foundProposal: TradeProposal | undefined;
    if (tradeData?.tradeId) {
      const proposals = await fetchTradeProposalsFromSupabase(myStore.id);
      foundProposal = proposals.find((p) => p.id === tradeData.tradeId);
    }

    const tradeId = tradeData?.tradeId || `trade-${Date.now()}`;
    const finalProposal: TradeProposal = foundProposal || {
      id: tradeId,
      myStoreId: tradeData?.myStoreId || counterpartStore.id,
      targetStoreId: tradeData?.targetStoreId || myStore.id,
      myExchangeItemId: tradeData?.myExchangeItemId || 'item-mine',
      targetExchangeItemId: tradeData?.targetExchangeItemId || 'item-target',
      myStoreName: tradeData?.myStoreName || counterpartStore.storeName,
      myOwnerName: tradeData?.myOwnerName || counterpartStore.ownerName,
      myItemTitle: tradeData?.myItemTitle || '상생 교환 품목',
      myItemPrice: tradeData?.myItemPrice || 0,
      myItemImageUrl: tradeData?.myItemImageUrl,
      targetStoreName: tradeData?.targetStoreName || myStore.storeName,
      targetOwnerName: tradeData?.targetOwnerName || myStore.ownerName,
      targetItemTitle: tradeData?.targetItemTitle || '상생 교환 대상 품목',
      targetItemPrice: tradeData?.targetItemPrice || 0,
      targetItemImageUrl: tradeData?.targetItemImageUrl,
      tradeType: tradeData?.tradeType || 'VOUCHER',
      tradeFulfillment: tradeData?.tradeFulfillment || '🎟️ 상생 교환권 맞발행',
      priceDifference: 0,
      proposedTime: tradeData?.pickupTime || '브레이크 타임',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // 2. Issue bilateral vouchers (mutual issuance into both stores' wallets)
    const res = issueBilateralVouchersForTrade(finalProposal, myStore.id);
    if (!res.success) {
      alert(res.error || '교환권 보관함 한도(최대 5장) 초과 또는 오류가 발생했습니다.');
      return;
    }

    // 3. Update proposal status in DB & LocalStorage
    if (finalProposal.id) {
      await updateTradeProposalStatus(finalProposal.id, 'ACCEPTED');
    }

    refreshVoucherWalletCount();
    refreshPendingAlertCounts();

    // 4. Send celebratory accept message to chat
    const myItemTitle = finalProposal.targetItemTitle || tradeData?.targetItemTitle || '상생 교환 품목';
    const counterpartItemTitle = finalProposal.myItemTitle || tradeData?.myItemTitle || '상생 교환 품목';

    const acceptText = `🤝 [${myStore.storeName}] 사장님께서 제안하신 1:1 물물교환을 수락하셨습니다!\n🎟️ 양측 매장의 상생 교환권이 보관함으로 상호 자동 발급되었습니다.\n• [${myStore.storeName}] 제공: ${myItemTitle}\n• [${counterpartStore.storeName}] 제공: ${counterpartItemTitle}\n📅 유효기간: 오늘부터 30일간 (내 교환권 보관함에서 슬라이드하여 사용 가능)`;

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

    await sendChatMessageToSupabase(counterpartStore.id, myStore.id, myStore.ownerName, acceptText);
  };

  const handleRejectTradeFromChat = async (tradeData?: any) => {
    if (!chatTargetStore) return;
    const counterpartStore = chatTargetStore;

    if (tradeData?.tradeId) {
      await updateTradeProposalStatus(tradeData.tradeId, 'REJECTED');
    }

    refreshPendingAlertCounts();

    const rejectText = `✋ [${myStore.storeName}] 사장님께서 현재 매장 사정으로 제안을 정중히 사양하셨습니다.\n다음에 더 좋은 기회에 다시 제안해 주세요!`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: rejectText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      systemAction: 'REJECT',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [counterpartStore.id]: [...(prev[counterpartStore.id] || []), newMsg],
    }));

    await sendChatMessageToSupabase(counterpartStore.id, myStore.id, myStore.ownerName, rejectText);
  };

  const handleAcceptTradeProposalAndOpenChat = async (proposal: TradeProposal) => {
    // 1. Issue bilateral vouchers into both stores' wallets
    const issueRes = issueBilateralVouchersForTrade(proposal, myStore.id);
    if (!issueRes.success) {
      alert(issueRes.error || '교환권 보관함 한도(최대 5장) 초과 또는 오류가 발생했습니다.');
      return;
    }

    // 2. Update status in DB & LocalStorage
    await updateTradeProposalStatus(proposal.id, 'ACCEPTED');

    refreshVoucherWalletCount();
    refreshPendingAlertCounts();

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
    setVoucherWalletCount(0);
    setPendingTradeCount(0);
    setPendingMenuTestCount(0);
    setConversations([]);
    setMessagesMap({});
    try {
      localStorage.removeItem('trademe_profile');
      localStorage.removeItem('trademe_my_store');
      localStorage.removeItem('trademe_vouchers');
      localStorage.removeItem('trademe_trade_proposals');
      localStorage.removeItem('trademe_local_chats');
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

  // 📱 모바일 웹앱 Bottom Navigation Tab State
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('MAP');

  const handleSelectMobileTab = (tab: MobileTab) => {
    setMobileActiveTab(tab);
    if (tab === 'MAP') {
      setSelectedStore(null);
      setIsChatDrawerOpen(false);
    } else if (tab === 'CHAT') {
      refreshConversations();
      setIsChatListModalOpen(true);
    } else if (tab === 'COMMUNITY') {
      setIsCommunityModalOpen(true);
    } else if (tab === 'WALLET') {
      refreshVoucherWalletCount();
      setIsCouponWalletOpen(true);
    } else if (tab === 'MY_STORE') {
      setIsAuthModalOpen(true);
    }
  };

  const hasRegisteredStore = isLoggedIn && !!myStore?.storeName && myStore.storeName !== '로그인 필요';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Navbar with Auth & Break Time Toggle */}
      <Navbar
        myBreakTimeActive={myStore.breakTimeActive}
        onToggleBreakTime={handleToggleBreakTime}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTradeDashboard={() => handleOpenTradeDashboard('RECEIVED')}
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
        onOpenChatListModal={() => {
          refreshConversations();
          setIsChatListModalOpen(true);
        }}
        chatCount={conversations.length}
        unreadChatCount={incomingChatAlert ? 1 : 0}
        onOpenCouponWallet={() => {
          refreshVoucherWalletCount();
          setIsCouponWalletOpen(true);
        }}
        voucherCount={voucherWalletCount}
      />

      {/* 🏆 쿠팡 파트너스 홈 상단 슬림 기획전 띠배너 (식자재/도매) */}
      <TopMainSlimBanner />

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
          <aside aria-label="Welcome Card" className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-200/90 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-5 transition-all">
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

      {/* 🎧 💌 아쿠아버디 스타일 원클릭 문의 & 법적 고지 푸터 (시크릿 3회 연속 클릭 이스터에그 내장) */}
      <Footer
        onOpenInquiry={handleOpenInquiry}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenWebmasterAuth={() => setIsWebmasterAuthOpen(true)}
      />

      {/* Auth / MyPage Modal (사장님 프로필 & 대시보드 올인원 허브) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalNotice(null);
          setMobileActiveTab('MAP');
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
        onOpenTradeDashboard={() => handleOpenTradeDashboard('RECEIVED')}
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
          setMobileActiveTab('MAP');
        }}
        myStore={myStore}
        onWalletUpdate={refreshVoucherWalletCount}
        onExploreStores={() => {
          setIsCouponWalletOpen(false);
          setMobileActiveTab('MAP');
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
        applicantUserId={myStore.id}
        applicantOwnerName={userOwnerName}
        applicantStoreName={myStore.storeName}
        applicantPhone={myStore.phone}
        onOpenMyApplications={() => {
          setIsMenuTestModalOpen(false);
          handleOpenTradeDashboard('MY_APPLICATIONS');
        }}
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
        onOpenMyApplications={() => {
          setIsMenuTestDashboardOpen(false);
          handleOpenTradeDashboard('MY_APPLICATIONS');
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
        initialTab={tradeDashboardTab}
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
        onAcceptTrade={handleAcceptTradeFromChat}
        onRejectTrade={handleRejectTradeFromChat}
        onOpenCouponWallet={() => setIsCouponWalletOpen(true)}
        onDeleteChat={handleDeleteConversation}
      />

      {/* 💬 1:1 사장님 대화함 목록 모달 */}
      <ChatListModal
        isOpen={isChatListModalOpen}
        onClose={() => {
          setIsChatListModalOpen(false);
          setMobileActiveTab('MAP');
        }}
        conversations={conversations}
        onDeleteConversation={handleDeleteConversation}
        onSelectConversation={(counterpartStoreId) => {
          let target = stores.find((s) => s.id === counterpartStoreId);
          if (!target) {
            const conv = conversations.find((c) => c.counterpartStoreId === counterpartStoreId);
            if (conv) {
              target = {
                id: conv.counterpartStoreId,
                ownerName: conv.counterpartOwnerName,
                storeName: conv.counterpartStoreName,
                category: (conv.counterpartCategory as any) || 'FOOD',
                categoryName: conv.counterpartCategoryName || '외식업',
                address: '인근 이웃 매장',
                lat: myStore.lat || 35.318,
                lng: myStore.lng || 129.006,
                phone: conv.counterpartPhone || '',
                isVerified: true,
                breakTimeActive: conv.counterpartBreakTimeActive ?? true,
                breakTimeHours: '10:00 - 22:00',
                storeImageUrl:
                  conv.counterpartStoreImageUrl ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                exchangeItems: [],
                rating: 5.0,
                reviewCount: 1,
              };
            }
          }
          if (target) {
            setIsChatListModalOpen(false);
            handleOpenChat(target);
          }
        }}
      />

      {/* 🔔 실시간 새 1:1 대화 도착 플로팅 토스트 알림 */}
      {incomingChatAlert && (
        <aside
          aria-label="New Chat Notification"
          className="fixed top-20 right-4 z-50 bg-gray-950/95 text-white p-4 rounded-3xl shadow-2xl border border-orange-400/90 backdrop-blur-md flex items-start gap-3.5 animate-in slide-in-from-top-4 max-w-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl flex-shrink-0 border border-orange-500/30 shadow-xs">
            {incomingChatAlert.message.includes('물물교환 제안') ? '🤝' : '💬'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${
                  incomingChatAlert.message.includes('물물교환 제안')
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                    : 'bg-orange-500'
                }`}
              >
                {incomingChatAlert.message.includes('물물교환 제안')
                  ? '🤝 새 물물교환 제안서 도착'
                  : '새 1:1 대화 도착'}
              </span>
              <button
                type="button"
                onClick={() => setIncomingChatAlert(null)}
                className="text-gray-400 hover:text-white p-0.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-extrabold text-white mt-1 truncate">
              [{incomingChatAlert.counterpartStore.storeName}] {incomingChatAlert.senderName} 사장님
            </p>
            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5 leading-relaxed font-normal">
              "{incomingChatAlert.message.replace(/<!--TRADE_DATA:.*?-->/g, '').trim()}"
            </p>
            <button
              type="button"
              onClick={() => {
                const target = incomingChatAlert.counterpartStore;
                setIncomingChatAlert(null);
                handleOpenChat(target);
              }}
              className="mt-2.5 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>
                {incomingChatAlert.message.includes('물물교환 제안')
                  ? '제안서 확인 및 수락/대화하기'
                  : '대화창 열기 및 답장하기'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ☕ 사장님 사랑방 커뮤니티 모달 */}
      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => {
          setIsCommunityModalOpen(false);
          setMobileActiveTab('MAP');
        }}
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

      {/* 👤🛡️ 웹마스터 모드 보안 인증 팝업 (연속 3회 클릭 이스터에그) */}
      <WebmasterAuthModal
        isOpen={isWebmasterAuthOpen}
        onClose={() => setIsWebmasterAuthOpen(false)}
        onSuccess={() => {
          setIsWebmasterAuthOpen(false);
          setIsWebmasterDashboardOpen(true);
        }}
      />

      {/* 🛡️ 웹마스터 관리자 커맨드 센터 (아쿠아버디 다크 블루 UI) */}
      <WebmasterDashboardModal
        isOpen={isWebmasterDashboardOpen}
        onClose={() => setIsWebmasterDashboardOpen(false)}
        stores={filteredStores}
        bannedStoreIds={bannedStoreIds}
        onToggleStoreBan={handleToggleStoreBan}
      />

      {/* 🎧 💌 원클릭 고객 지원 & 제휴 접수 모달 */}
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        defaultType={inquiryDefaultType}
        defaultSenderName={myStore?.storeName && myStore.storeName !== '로그인 필요' ? `${myStore.storeName} (${userOwnerName})` : ''}
      />

      {/* 📜 이용약관 모달 */}
      <TermsOfServiceModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* 🔒 개인정보처리방침 모달 */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* 📱 모바일 전용 5대 탭 Bottom Navigation Bar (PWA 친화적 UI) */}
      <MobileBottomNav
        activeTab={mobileActiveTab}
        onSelectTab={handleSelectMobileTab}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        voucherCount={voucherWalletCount}
        chatCount={conversations.length}
        unreadChatCount={incomingChatAlert ? 1 : 0}
        pendingAlertCount={pendingTradeCount + pendingMenuTestCount}
        myBreakTimeActive={myStore.breakTimeActive}
      />

    </div>
  );
};

export default App;
