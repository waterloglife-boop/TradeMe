import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { StoreDetailDrawer } from './components/StoreDetailDrawer';
import { RegisterModal } from './components/RegisterModal';
import { TradeProposalModal } from './components/TradeProposalModal';
import { ChatDrawer } from './components/ChatDrawer';
import { INITIAL_STORES, MY_STORE_MOCK } from './data/mockData';
import { Store, ExchangeItem, ChatMessage } from './types/trade';

export const App: React.FC = () => {
  const [myStore, setMyStore] = useState<Store>(MY_STORE_MOCK);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(INITIAL_STORES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyBreakTime, setOnlyBreakTime] = useState<boolean>(false);

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

  // Toggle My Store Break Time status
  const handleToggleBreakTime = () => {
    const updatedStatus = !myStore.breakTimeActive;
    const updatedMyStore = { ...myStore, breakTimeActive: updatedStatus };
    setMyStore(updatedMyStore);

    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );
  };

  // Register New Exchange Item for My Store
  const handleRegisterNewItem = (newItem: Omit<ExchangeItem, 'id' | 'storeId'>) => {
    const createdItem: ExchangeItem = {
      ...newItem,
      id: `my-item-${Date.now()}`,
      storeId: myStore.id,
    };

    const updatedMyStore = {
      ...myStore,
      exchangeItems: [createdItem, ...myStore.exchangeItems],
    };

    setMyStore(updatedMyStore);
    setStores((prevStores) =>
      prevStores.map((s) => (s.id === myStore.id ? updatedMyStore : s))
    );

    // If currently selected store is my store, update selectedStore
    if (selectedStore?.id === myStore.id) {
      setSelectedStore(updatedMyStore);
    }
  };

  // Open 1:1 Proposal Modal
  const handleOpenProposal = (targetItem: ExchangeItem) => {
    setTargetProposalItem(targetItem);
    setIsProposalModalOpen(true);
  };

  // Send 1:1 Proposal Action
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

  // Open Chat Drawer for a Store
  const handleOpenChat = (store: Store) => {
    setChatTargetStore(store);
    setIsChatDrawerOpen(true);
  };

  // Send message in chat drawer
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

  // Filter stores according to active category and breaktime toggle
  const filteredStores = stores.filter((store) => {
    if (onlyBreakTime && !store.breakTimeActive) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FOOD') return ['KOREAN', 'JAPANESE', 'WESTERN', 'CHINESE', 'CAFE'].includes(store.category);
    if (selectedCategory === 'ACCOMMODATION') return store.category === 'ACCOMMODATION' || store.category === 'OTHER';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Navbar with Break Time Toggle SW & Filters */}
      <Navbar
        myBreakTimeActive={myStore.breakTimeActive}
        onToggleBreakTime={handleToggleBreakTime}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onlyBreakTime={onlyBreakTime}
        onToggleOnlyBreakTime={() => setOnlyBreakTime(!onlyBreakTime)}
        storeCount={filteredStores.length}
      />

      {/* Main Interactive Map View */}
      <main className="relative flex-1">
        <MapView
          stores={filteredStores}
          selectedStore={selectedStore}
          onSelectStore={(store) => setSelectedStore(store)}
          myStore={myStore}
        />

        {/* Selected Store Detail & Exchange Items Drawer */}
        <StoreDetailDrawer
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onOpenProposal={handleOpenProposal}
          onOpenChat={handleOpenChat}
          isMyStore={selectedStore?.id === myStore.id}
        />
      </main>

      {/* Register New Exchange Item Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegisterNewItem}
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
