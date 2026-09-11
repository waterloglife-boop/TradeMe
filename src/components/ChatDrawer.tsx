import React, { useState } from 'react';
import { X, Send, Phone, ArrowRightLeft, CheckCircle2, Store, Clock, Trash2 } from 'lucide-react';
import { Store as StoreType, ChatMessage } from '../types/trade';
import { getAllStoredVouchers } from '../lib/supabase';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: StoreType | null;
  myStore: StoreType;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAcceptTrade?: (tradeData?: any) => void;
  onRejectTrade?: (tradeData?: any) => void;
  onOpenCouponWallet?: () => void;
  onDeleteChat?: (counterpartStoreId: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  targetStore,
  myStore,
  messages,
  onSendMessage,
  onAcceptTrade,
  onRejectTrade,
  onOpenCouponWallet,
  onDeleteChat,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen || !targetStore) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const parseProposalData = (msgText: string) => {
    const match = msgText.match(/<!--TRADE_DATA:(.*?)-->/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {}
    }
    const myItemMatch = msgText.match(/(?:제공 품목|제공):\s*([^\n(]+)(?:\(([^)]+)\))?/);
    const targetItemMatch = msgText.match(/(?:희망 품목|희망):\s*([^\n(]+)(?:\(([^)]+)\))?/);
    const diffMatch = msgText.match(/정산(?:\s*조건)?:\s*([^\n]+)/);
    const methodMatch = msgText.match(/(?:교환|이용)\s*방식:\s*([^\n]+)/);
    const timeMatch = msgText.match(/희망\s*시각:\s*([^\n]+)/);
    const memoMatch = msgText.match(/(?:메모|사장님 메모):\s*([^\n]+)/);

    return {
      tradeId: undefined,
      myItemTitle: myItemMatch ? myItemMatch[1].trim() : '상생 교환 품목',
      myItemPriceText: myItemMatch && myItemMatch[2] ? myItemMatch[2].trim() : '',
      targetItemTitle: targetItemMatch ? targetItemMatch[1].trim() : '상생 교환 대상 품목',
      targetItemPriceText: targetItemMatch && targetItemMatch[2] ? targetItemMatch[2].trim() : '',
      diffText: diffMatch ? diffMatch[1].trim() : '차액 0원 (동일가 맞교환)',
      tradeFulfillment: methodMatch ? methodMatch[1].trim() : '🎟️ 상생 교환권(모바일 쿠폰) 즉시 맞발행',
      pickupTime: timeMatch ? timeMatch[1].trim() : '브레이크 타임',
      memoMessage: memoMatch ? memoMatch[1].trim() : '',
    };
  };

  const getProposalStatus = (msgIndex: number, tradeData: any): 'PENDING' | 'ACCEPTED' | 'REJECTED' => {
    const subsequent = messages.slice(msgIndex + 1);
    const hasAccept = subsequent.some(
      (m) => m.systemAction === 'ACCEPT' || (m.message && m.message.includes('수락하셨습니다'))
    );
    if (hasAccept) return 'ACCEPTED';

    const hasReject = subsequent.some(
      (m) => m.systemAction === 'REJECT' || (m.message && (m.message.includes('사양하겠습니다') || m.message.includes('거절')))
    );
    if (hasReject) return 'REJECTED';

    if (tradeData?.tradeId) {
      // 1. Check if voucher was issued for this trade
      try {
        const vList = getAllStoredVouchers();
        if (vList.some((v) => v.tradeId === tradeData.tradeId)) return 'ACCEPTED';
      } catch (e) {}

      // 2. Check local proposals
      try {
        const raw = localStorage.getItem('trademe_trade_proposals');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((p: any) => p.id === tradeData.tradeId);
          if (found?.status === 'ACCEPTED') return 'ACCEPTED';
          if (found?.status === 'REJECTED') return 'REJECTED';
        }
      } catch (e) {}
    }
    return 'PENDING';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform animate-in slide-in-from-right">
      
      {/* Chat Header */}
      <div className="p-4 bg-gray-900 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={targetStore.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'}
              alt={targetStore.storeName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
              }}
              className="w-10 h-10 rounded-2xl object-cover border border-white/20 shadow-md"
            />
            {targetStore.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <span>{targetStore.storeName}</span>
              <span className="text-[10px] bg-orange-500/80 px-1.5 py-0.5 rounded text-white font-normal">
                {targetStore.categoryName}
              </span>
            </h3>
            <p className="text-xs text-gray-300">
              {targetStore.ownerName}과 1:1 물물교환 대화 중
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`tel:${targetStore.phone}`}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
            title="전화걸기"
          >
            <Phone className="w-4 h-4" />
          </a>
          {onDeleteChat && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`'${targetStore.storeName}' 사장님과의 대화 내역을 모두 삭제하고 대화방을 나가시겠습니까?`)) {
                  onDeleteChat(targetStore.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
              title="대화 내역 전체 삭제 및 나가기"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Breaktime Notification Banner */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
        <span className="flex items-center gap-1 font-semibold">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          상대 매장 브레이크 타임: {targetStore.breakTimeHours}
        </span>
        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
          {targetStore.breakTimeActive ? '교환 가능' : '영업 중'}
        </span>
      </div>

      {/* Quick Access to Coupon Wallet */}
      {onOpenCouponWallet && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-950 font-bold text-[11px]">
            <span>🎟️</span>
            <span>1:1 상생 교환권 보관함</span>
          </div>
          <button
            type="button"
            onClick={onOpenCouponWallet}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>보관함 열기</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
        <div className="text-center my-2">
          <span className="text-[11px] bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium">
            1:1 사장님 물물교환 대화방이 생성되었습니다
          </span>
        </div>

        {messages.map((msg, idx) => {
          const isProposalMsg =
            msg.systemAction === 'PROPOSAL' ||
            msg.message?.includes('[1:1 물물교환') ||
            msg.message?.includes('TRADE_DATA:');

          const isAcceptMsg =
            msg.systemAction === 'ACCEPT' ||
            (msg.message?.includes('수락하셨습니다') && msg.message?.includes('교환권'));

          const isRejectMsg =
            msg.systemAction === 'REJECT' ||
            msg.message?.includes('사양하겠습니다') ||
            msg.message?.includes('거절');

          const tradeData = isProposalMsg ? parseProposalData(msg.message) : null;
          const status = isProposalMsg ? getProposalStatus(idx, tradeData) : 'PENDING';
          const cleanText = msg.message.replace(/<!--TRADE_DATA:.*?-->/g, '').trim();

          const isSender = Boolean(msg.isMe || (myStore?.id && msg.senderId === myStore.id));

          const avatarUrl = isSender
            ? myStore.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
            : targetStore.storeImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Sender Store Thumbnail Avatar */}
              <img
                src={avatarUrl}
                alt={msg.senderName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
                }}
                className="w-7 h-7 rounded-xl object-cover border border-gray-200 shadow-xs flex-shrink-0 mb-1"
                title={msg.senderName}
              />

              <div className={`flex flex-col ${isProposalMsg ? 'w-[90%] max-w-md' : 'max-w-[80%]'} ${isSender ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.senderName}</span>
                
                {/* 1) 🤝 1:1 물물교환 정식 제안서 Interactive Card */}
                {isProposalMsg && tradeData ? (
                  <div className="w-full my-1 p-3.5 bg-white rounded-2xl border-2 border-orange-300 shadow-md text-gray-900 space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                      <div className="flex items-center gap-1.5 font-black text-xs text-orange-950">
                        <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                        <span>1:1 물물교환 정식 제안서</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs ${
                        status === 'ACCEPTED'
                          ? 'bg-emerald-600 text-white'
                          : status === 'REJECTED'
                          ? 'bg-gray-400 text-white'
                          : 'bg-orange-500 text-white animate-pulse'
                      }`}>
                        {status === 'ACCEPTED' ? '🎉 체결 완료' : status === 'REJECTED' ? '✋ 정중히 사양됨' : '⏳ 수락 대기 중'}
                      </span>
                    </div>

                    {/* Items Comparison Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200/80">
                        <span className="text-[10px] font-bold text-orange-700">제안 매장 품목 (제공)</span>
                        <div className="font-extrabold text-gray-900 truncate mt-0.5" title={tradeData.myItemTitle}>
                          {tradeData.myItemTitle}
                        </div>
                        <div className="text-[11px] font-black text-orange-600 mt-0.5">
                          {tradeData.myItemPrice ? `${tradeData.myItemPrice.toLocaleString()}원` : tradeData.myItemPriceText}
                        </div>
                      </div>

                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                        <span className="text-[10px] font-bold text-amber-800">희망 대상 품목 (요청)</span>
                        <div className="font-extrabold text-gray-900 truncate mt-0.5" title={tradeData.targetItemTitle}>
                          {tradeData.targetItemTitle}
                        </div>
                        <div className="text-[11px] font-black text-amber-700 mt-0.5">
                          {tradeData.targetItemPrice ? `${tradeData.targetItemPrice.toLocaleString()}원` : tradeData.targetItemPriceText}
                        </div>
                      </div>
                    </div>

                    {/* Conditions Pill */}
                    <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] text-gray-700 space-y-1 border border-gray-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">정산 차액:</span>
                        <span className="font-extrabold text-orange-950">{tradeData.diffText || '차액 0원 (동일가 교환)'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">교환 방식:</span>
                        <span className="font-bold text-gray-800">{tradeData.tradeFulfillment || '🎟️ 상생 교환권 맞발행'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">희망 시각:</span>
                        <span className="font-bold text-gray-800">{tradeData.pickupTime || '브레이크 타임'}</span>
                      </div>
                      {tradeData.memoMessage && (
                        <div className="pt-1 border-t border-gray-200 text-gray-700 text-[10px]">
                          💬 사장님 메모: "{tradeData.memoMessage}"
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Area */}
                    {!isSender && status === 'PENDING' && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAcceptTrade && onAcceptTrade(tradeData)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>제안 수락하기 (교환권 즉시 발행)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectTrade && onRejectTrade(tradeData)}
                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all active:scale-95"
                          >
                            거절
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 text-center">
                          💡 수락 전 아래 대화창에서 시간이나 품목을 먼저 조율하실 수 있습니다.
                        </p>
                      </div>
                    )}

                    {isSender && status === 'PENDING' && (
                      <div className="pt-1 text-center text-[11px] font-bold text-amber-900 bg-amber-50 py-2 rounded-xl border border-amber-200">
                        ⏳ 상대 사장님의 수락을 기다리는 중입니다. 아래 대화창에서 자유롭게 조율하세요!
                      </div>
                    )}

                    {status === 'ACCEPTED' && (
                      <div className="pt-1 space-y-1.5">
                        <div className="text-center text-[11px] font-black text-emerald-800 bg-emerald-50 py-2 rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>1:1 물물교환 체결 완료! 상호 교환권이 보관함에 자동 발급되었습니다.</span>
                        </div>
                        {onOpenCouponWallet && (
                          <button
                            type="button"
                            onClick={onOpenCouponWallet}
                            className="w-full py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-xs border border-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <span>🎟️ 내 교환권 보관함에서 확인하기</span>
                            <span>&rarr;</span>
                          </button>
                        )}
                      </div>
                    )}

                    {status === 'REJECTED' && (
                      <div className="pt-1 text-center text-[11px] font-bold text-gray-600 bg-gray-100 py-2 rounded-xl border border-gray-200">
                        ✋ 이번 제안은 사양되었습니다. 다른 품목이나 조건으로 다시 제안해 보세요.
                      </div>
                    )}
                  </div>
                ) : isAcceptMsg ? (
                  /* 2) 🎉 체결 완료 축하 카드 */
                  <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md border border-emerald-300/40 space-y-2">
                    <div className="font-black text-xs flex items-center gap-1.5 text-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>1:1 물물교환 체결 완료 & 상호 교환권 발급</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-95 whitespace-pre-line">
                      {cleanText}
                    </p>
                    {onOpenCouponWallet && (
                      <button
                        type="button"
                        onClick={onOpenCouponWallet}
                        className="mt-1.5 w-full py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        <span>🎟️</span>
                        <span>내 교환권 보관함에서 확인하기</span>
                      </button>
                    )}
                  </div>
                ) : isRejectMsg ? (
                  /* 3) ✋ 사양 안내 카드 */
                  <div className="p-3 bg-gray-100 rounded-2xl text-gray-700 shadow-xs border border-gray-300 space-y-1">
                    <div className="font-black text-xs text-gray-800 flex items-center gap-1">
                      <span>✋</span>
                      <span>제안 사양 안내</span>
                    </div>
                    <p className="text-[11px] leading-relaxed whitespace-pre-line">
                      {cleanText}
                    </p>
                  </div>
                ) : (
                  /* 4) 일반 대화 말풍선 */
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      msg.isMe
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{cleanText}</p>
                    <span className={`block text-[9px] mt-1 text-right ${msg.isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="p-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          onClick={() => onSendMessage("안녕하세요 사장님! 오늘 브레이크 타임 때 1:1 물물교환 가능할까요?")}
          className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 rounded-full font-medium whitespace-nowrap"
        >
          👋 1:1 물물교환 가능한가요?
        </button>
        <button
          onClick={() => onSendMessage("포장해서 15시 30분쯤 직접 픽업하러 가겠습니다!")}
          className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 rounded-full font-medium whitespace-nowrap"
        >
          🚗 15시 30분 픽업갈게요
        </button>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
