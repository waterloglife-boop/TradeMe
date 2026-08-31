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
  fetchUserStoreFromSupabase
} from './lib/supabase';
import { MapPin } from 'lucide-react';

const INITIAL_MY_STORE_STATE: Store = {
  id: '',
  ownerName: '김동욱',
  storeName: '마라위크',
  category: 'FOOD',
  categoryName: '외식업',
  address: '경남 양산시 북정서길 25 104호',
  lat: 35.3594007321187,
  lng: 129.041885145232,
  phone: '01048548777',
  isVerified: true,
  breakTimeActive: false,
  breakTimeHours: '10:00 - 22:00',
  storeImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  exchangeItems: [],
  rating: 5.0,
  reviewCount: 0,
  isMenuTesting: false,
};

export const App: React.FC = () => {
  const [myStore, setMyStore] = useState<Store>(INITIAL_MY_STORE_STATE);
  const [stores, setStores] = useState<Store[]>([]);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyBreakTime, setOnlyBreakTime] = useState<boolean>(false);
  const [onlyMenuTesting, setOnlyMenuTesting] = useState<boolean>(false);
  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'NAVER'>('NAVER');

  // Notification Badges State
  const [pendingTradeCount, setPendingTradeCount] = useState(0);
  const [pendingMenuTestCount, setPendingMenuTestCount] = useState(0);

  // Location Picker State
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number }>({
    lat: 35.3594007321187,
    lng: 129.041885145232,
  });

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userOwnerName, setUserOwnerName] = useState('김동욱');

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

  // Chat state
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatTargetStore, setChatTargetStore] = useState<Store | null>(null);
  const [messagesMap, setMessagesMap] = useState<{ [storeId: string]: ChatMessage[] }>({});

  // Pure Supabase Data Loading on Initial Mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Fetch all registered stores directly from Supabase
        const fetchedStores = await fetchStoresFromSupabase();
        setStores(fetchedStores || []);
        if (fetchedStores && fetchedStores.length > 0) {
          setSelectedStore(fetchedStores[0]);
        }

        // 2. Fetch authenticated owner user profile from Supabase
        const userProfile = await fetchUserProfileFromSupabase();
        if (userProfile && userProfile.owner_name) {
          setUserOwnerName(userProfile.owner_name);
        }

        // 3. Fetch authenticated owner store from Supabase
        const userStore = await fetchUserStoreFromSupabase();
        if (userStore) {
          setMyStore(userStore);
          if (userStore.lat && userStore.lng) {
            setPickedLocation({ lat: userStore.lat, lng: userStore.lng });
          }
        }
      } catch (err) {
        console.error('[App Error] Initial data loading exception:', err);
      }
    }
    loadInitialData();
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

  const handleLoginSuccess = (ownerName: string, storeName: string) => {
    setIsLoggedIn(true);
    setUserOwnerName(ownerName);
    setMyStore((prev) => ({ ...prev, ownerName, storeName }));
  };

  const handleToggleBreakTime = () => {
    const updatedStatus = !myStore.breakTimeActive;
    const updatedMyStore = { ...myStore, breakTimeActive: updatedStatus };
    setMyStore(updatedMyStore);

    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );

    updateStoreStatusInSupabase(myStore.id, updatedStatus);
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
    setTargetProposalItem(targetItem);
    setIsProposalModalOpen(true);
  };

  const handleSendProposal = (
    myMenu: ExchangeItem,
    targetMenu: ExchangeItem,
    diffPrice: number,
    pickupTime: string,
    isPoke: boolean = false,
    memoMessage: string = ''
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
      }
    );

    // If it's a REALTIME exchange proposal (!isPoke), open chat and send proposal bubble
    // If it's a POKE (isPoke === true), send asynchronously without intrusive chat popup
    if (!isPoke) {
      const proposalMsgText = `[1:1 물물교환 제안]\n내 메뉴: ${myMenu.title} (${myMenu.estimatedPrice.toLocaleString()}원)\n요청 메뉴: ${targetMenu.title} (${targetMenu.estimatedPrice.toLocaleString()}원)\n정산: ${diffText}\n희망 시각: ${pickupTime}${memoMessage ? `\n메모: ${memoMessage}` : ''}`;

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
    const counterpartStoreId = proposal.myStoreId === myStore.id ? proposal.targetStoreId : proposal.myStoreId;
    const counterpartStore = stores.find((s) => s.id === counterpartStoreId) || {
      id: counterpartStoreId,
      ownerName: proposal.myOwnerName || '이웃 사장님',
      storeName: proposal.myStoreName || '이웃 매장',
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

    const acceptText = `🤝 [${myStore.storeName}] 사장님께서 제안하신 1:1 물물교환을 수락하셨습니다! 교환 픽업 시간과 상세 내용을 확인해 주세요.`;
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
      lng
    );

    try {
      localStorage.setItem(
        'trademe_profile',
        JSON.stringify({ ownerName, storeName, phone, businessNumber, storeImageUrl })
      );
      localStorage.setItem('trademe_my_store', JSON.stringify(updatedMyStore));
    } catch (e) {}
  };

  const handleSaveExchangeItems = (updatedItems: ExchangeItem[]) => {
    const updatedMyStore: Store = {
      ...myStore,
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserOwnerName('로그인 필요');
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
        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur px-3.5 py-2 rounded-xl shadow-lg border border-orange-200 text-xs font-bold text-orange-900 flex items-center gap-1.5 animate-bounce">
          <MapPin className="w-4 h-4 text-orange-600" />
          <span>💡 상단 [물물교환 품목 등록]에서 도로명 주소로 위치를 조율하세요</span>
        </div>

        {/* Selected Store Detail & Exchange Items Drawer */}
        <StoreDetailDrawer
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onOpenProposal={handleOpenProposal}
          onOpenChat={handleOpenChat}
          onOpenMenuTestApply={(store, campaign) => {
            setTargetMenuTestStore(store);
            setTargetMenuTestCampaign(campaign || null);
            setIsMenuTestModalOpen(true);
          }}
          onOpenMenuTestDashboard={() => setIsMenuTestDashboardOpen(true)}
          isMyStore={selectedStore?.id === myStore.id}
        />
      </main>

      {/* Auth / MyPage Modal (사장님 프로필 & 대시보드 올인원 허브) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        userStoreName={myStore.storeName}
        myStore={myStore}
        onLoginSuccess={handleLoginSuccess}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onOpenManageItems={() => setIsManageItemsModalOpen(true)}
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
        onOpenRegisterMenuTest={(campaignToEdit) => {
          setEditingCampaign(campaignToEdit || null);
          setIsRegisterMenuTestModalOpen(true);
        }}
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
      />

    </div>
  );
};

export default App;
