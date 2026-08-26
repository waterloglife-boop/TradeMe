import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { NaverMapView } from './components/NaverMapView';
import { StoreDetailDrawer } from './components/StoreDetailDrawer';
import { RegisterModal } from './components/RegisterModal';
import { RegisterStoreAndItemsModal } from './components/RegisterStoreAndItemsModal';
import { TradeProposalModal } from './components/TradeProposalModal';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { INITIAL_STORES, MY_STORE_MOCK } from './data/mockData';
import { Store, ExchangeItem, ChatMessage } from './types/trade';
import { fetchStoresFromSupabase, subscribeToTradeChat } from './lib/supabase';

export const App: React.FC = () => {
  const [myStore, setMyStore] = useState<Store>(MY_STORE_MOCK);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(INITIAL_STORES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyBreakTime, setOnlyBreakTime] = useState<boolean>(false);
  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'NAVER'>('NAVER');

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userOwnerName, setUserOwnerName] = useState('홍길동 사장님');

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
        message: '안녕하세요 돈까스 사장님! 오늘 15시에 갈비 도시락 세트 바꿔먹기 가능한가요?',
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

  // Supabase Realtime Chat Subscription for active chat store
  useEffect(() => {
    if (!chatTargetStore) return;
    const unsubscribe = subscribeToTradeChat(chatTargetStore.id, (newMsg) => {
      setMessagesMap((prev) => ({
        ...prev,
        [chatTargetStore.id]: [...(prev[chatTargetStore.id] || []), newMsg],
      }));
    });
    return () => unsubscribe();
  }, [chatTargetStore]);

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

    const proposalMsgText = `[1:1 바꿔먹기 제안]\n내 메뉴: ${myMenu.title} (${myMenu.estimatedPrice.toLocaleString()}원)\n요청 메뉴: ${targetMenu.title} (${targetMenu.estimatedPrice.toLocaleString()}원)\n정산: ${diffText}\n희망 시각: ${pickupTime}`;

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
  };

  const filteredStores = stores.filter((store) => {
    if (onlyBreakTime && !store.breakTimeActive) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FOOD') return ['KOREAN', 'JAPANESE', 'WESTERN', 'CHINESE', 'CAFE'].includes(store.category);
    if (selectedCategory === 'ACCOMMODATION') return store.category === 'ACCOMMODATION' || store.category === 'OTHER';
    return true;
  });

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
        {mapEngine === 'LEAFLET' ? (
          <MapView
            stores={filteredStores}
            selectedStore={selectedStore}
            onSelectStore={(store) => setSelectedStore(store)}
            myStore={myStore}
          />
        ) : (
          <NaverMapView
            stores={filteredStores}
            selectedStore={selectedStore}
            onSelectStore={(store) => setSelectedStore(store)}
            myStore={myStore}
          />
        )}

        {/* Map Engine Toggle Switch */}
        <div className="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-gray-200 text-xs flex items-center gap-2">
          <span className="font-bold text-gray-700">지도 엔진:</span>
          <button
            onClick={() => setMapEngine('LEAFLET')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              mapEngine === 'LEAFLET' ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-600'
            }`}
          >
            기본 지도
          </button>
          <button
            onClick={() => setMapEngine('NAVER')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              mapEngine === 'NAVER' ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600'
            }`}
          >
            네이버 지도
          </button>
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

      {/* Auth Modal (Login / Sign up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Register Store & Exchange Items Modal */}
      <RegisterStoreAndItemsModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterNewStoreAndItems}
        currentOwnerName={userOwnerName}
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
