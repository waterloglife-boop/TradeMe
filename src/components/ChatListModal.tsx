import React from 'react';
import { X, MessageSquare, ArrowRight, Store, Clock, ChevronRight } from 'lucide-react';
import { ChatConversationSummary } from '../types/trade';

interface ChatListModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversationSummary[];
  onSelectConversation: (counterpartStoreId: string) => void;
  isLoading?: boolean;
}

export const ChatListModal: React.FC<ChatListModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gray-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-lg">
              💬
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>1:1 사장님 대화함</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                  {conversations.length}개 대화
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                이웃 사장님들과 진행 중인 1:1 물물교환 대화 목록입니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-gray-50/70">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>대화 목록을 불러오는 중입니다...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-14 text-center text-gray-500 space-y-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl mx-auto border border-orange-100">
                💬
              </div>
              <h4 className="font-extrabold text-sm text-gray-800">
                아직 주고받은 1:1 대화가 없습니다
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                지도에서 이웃 가게를 선택하고 <strong>[1:1 대화하기]</strong>나 <strong>[물물교환 제안하기]</strong>를 눌러 상생 교환을 먼저 시작해 보세요!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.counterpartStoreId}
                onClick={() => onSelectConversation(conv.counterpartStoreId)}
                className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        conv.counterpartStoreImageUrl ||
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={conv.counterpartStoreName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    {conv.counterpartBreakTimeActive && (
                      <span
                        title="교환 가능 매장"
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">
                        {conv.counterpartStoreName}
                      </h4>
                      {conv.counterpartCategoryName && (
                        <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 text-[10px] font-black flex-shrink-0">
                          {conv.counterpartCategoryName}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 font-medium truncate">
                        ({conv.counterpartOwnerName})
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 truncate font-normal leading-relaxed">
                      {conv.lastMessage}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{conv.lastMessageAt}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center gap-1 flex-shrink-0 pl-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-orange-50 group-hover:bg-orange-600 group-hover:text-white text-orange-600 text-xs font-extrabold transition-all flex items-center gap-1"
                  >
                    <span>대화창 열기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-gray-100 border-t border-gray-200 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <span>🔒 1:1 대화 내용은 당사자 간에만 실시간으로 안전하게 연결됩니다.</span>
        </div>
      </div>
    </div>
  );
};
