import React, { useState } from 'react';
import { X, Send, Phone, ArrowRightLeft, CheckCircle2, Store, Clock } from 'lucide-react';
import { Store as StoreType, ChatMessage } from '../types/trade';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: StoreType | null;
  myStore: StoreType;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAcceptTrade?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  targetStore,
  myStore,
  messages,
  onSendMessage,
  onAcceptTrade,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen || !targetStore) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform animate-in slide-in-from-right">
      
      {/* Chat Header */}
      <div className="p-4 bg-gray-900 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-md">
            🏬
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
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
            title="전화걸기"
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
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

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
        <div className="text-center my-2">
          <span className="text-[11px] bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium">
            1:1 사장님 물물교환 대화방이 생성되었습니다
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.senderName}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                msg.isMe
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
              }`}
            >
              {/* If Proposal System Action */}
              {msg.systemAction === 'PROPOSAL' && (
                <div className="mb-2 p-2 bg-white/20 rounded-lg backdrop-blur border border-white/30 text-white">
                  <div className="font-extrabold flex items-center gap-1 mb-1">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> 1:1 물물교환 제안서
                  </div>
                  <p className="text-[11px] opacity-90">{msg.message}</p>
                </div>
              )}

              {msg.systemAction !== 'PROPOSAL' && <p className="whitespace-pre-line">{msg.message}</p>}
              <span className={`block text-[9px] mt-1 text-right ${msg.isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
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
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
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
