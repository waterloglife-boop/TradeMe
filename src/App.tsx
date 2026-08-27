import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { NaverMapView } from './components/NaverMapView';
import { StoreDetailDrawer } from './components/StoreDetailDrawer';
import { RegisterStoreAndItemsModal } from './components/RegisterStoreAndItemsModal';
import { TradeProposalModal } from './components/TradeProposalModal';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { INITIAL_STORES, MY_STORE_MOCK } from './data/mockData';
import { Store, ExchangeItem, ChatMessage } from './types/trade';
import { fetchStoresFromSupabase, subscribeToTradeChat, sendChatMessageToSupabase, sendTradeProposalToSupabase, fetchChatHistory } from './lib/supabase';
import { MapPin } from 'lucide-react';

export const App: React.FC = () => {
  const [myStore, setMyStore] = useState<Store>(MY_STORE_MOCK);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(INITIAL_STORES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyBreakTime, setOnlyBreakTime] = useState<boolean>(false);
  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'NAVER'>('NAVER');

  // Location Picker State
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number }>({
    lat: 35.3605,
    lng: 129.0468,
  });

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userOwnerName, setUserOwnerName] = useState('사장님 (마라위크)');

  // Modals & Drawers state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [targetProposalItem, setTargetProposalItem] = useState<ExchangeItem | null>(null);
  
  // Chat state
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatTargetStore, setChatTargetStore] = useState<Store | null>(null);
  const [messagesMap, setMessagesMap] = useState<{ [storeId: string]: ChatMessage[] }>({
    'store-1': [
      {
        id: 'msg-1',
        senderId: 'store-1',
        senderName: '박해운 사장님',
        message: '안녕하세요 돈까스 사장님! 오늘 15시에 갈비 도시락 세트 1:1 물물교환 가능한가요?',
        timestamp: '오후 2:15',
        isMe: false,
      },
    ],
  });

  // Load Stores from Supabase on Mount
  useEffect(() => {
    async function loadStores() {
      const fetched = await fetchStoresFromSupabase();
      if (fetched && fetched.length > 0) {
        setStores(fetched);
      }
    }
    loadStores();
  }, []);

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
    pickupTime: string
  ) => {
    if (!selectedStore) return;

    const diffText =
      diffPrice === 0
        ? '차액 0원 (동일가 교환)'
        : diffPrice > 0
        ? `내가 ${diffPrice.toLocaleString()}원 현장 추가정산`
        : `상대가 ${Math.abs(diffPrice).toLocaleString()}원 현장 추가정산`;

    const proposalMsgText = `[1:1 물물교환 제안]\n내 메뉴: ${myMenu.title} (${myMenu.estimatedPrice.toLocaleString()}원)\n요청 메뉴: ${targetMenu.title} (${targetMenu.estimatedPrice.toLocaleString()}원)\n정산: ${diffText}\n희망 시각: ${pickupTime}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myStore.id,
      senderName: myStore.ownerName,
      message: proposalMsgText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      systemAction: 'PROPOSAL',
    };

    const storeId = selectedStore.id;

    // Send proposal record to Supabase DB trades table
    sendTradeProposalToSupabase(
      myStore.id,
      storeId,
      myMenu.id,
      targetMenu.id,
      diffPrice,
      pickupTime
    );

    // Send proposal chat message to Supabase DB chat_messages table
    sendChatMessageToSupabase(storeId, myStore.id, myStore.ownerName, proposalMsgText);

    setMessagesMap((prev) => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), newMsg],
    }));

    setChatTargetStore(selectedStore);
    setIsChatDrawerOpen(true);
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
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FOOD') return ['KOREAN', 'JAPANESE', 'WESTERN', 'CHINESE', 'SNACK', 'CAFE', 'PUB'].includes(store.category);
    if (selectedCategory === 'RETAIL') return ['CONVENIENCE', 'BAKERY', 'FRESH_FOOD'].includes(store.category);
    if (selectedCategory === 'BEAUTY') return store.category === 'BEAUTY';
    if (selectedCategory === 'ACCOMMODATION') return ['ACCOMMODATION', 'LEISURE'].includes(store.category);
    if (selectedCategory === 'SERVICE') return ['LAUNDRY', 'FITNESS', 'OTHER'].includes(store.category);
    return true;
  });

  const handleUpdateProfile = (ownerName: string, storeName: string, phone?: string) => {
    setUserOwnerName(ownerName);
    setMyStore((prev) => ({
      ...prev,
      ownerName,
      storeName,
      phone: phone || prev.phone,
    }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserOwnerName('로그인 필요');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Navbar with Auth & Break Time Toggle */}
      <Navbar
        myBreakTimeActive={myStore.breakTimeActive}
        onToggleBreakTime={handleToggleBreakTime}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onlyBreakTime={onlyBreakTime}
        onToggleOnlyBreakTime={() => setOnlyBreakTime(!onlyBreakTime)}
        storeCount={filteredStores.length}
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
          isMyStore={selectedStore?.id === myStore.id}
        />
      </main>

      {/* Auth Modal (Login / Sign up / Profile Edit) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isLoggedIn={isLoggedIn}
        userOwnerName={userOwnerName}
        userStoreName={myStore.storeName}
        onLoginSuccess={handleLoginSuccess}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      />

      {/* Register Store & Exchange Items Modal */}
      <RegisterStoreAndItemsModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterNewStoreAndItems}
        currentOwnerName={userOwnerName}
        pickedLat={pickedLocation.lat}
        pickedLng={pickedLocation.lng}
        onUpdatePickedLocation={(lat, lng) => setPickedLocation({ lat, lng })}
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
