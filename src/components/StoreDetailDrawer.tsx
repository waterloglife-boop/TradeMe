import React from 'react';
import { Store, ExchangeItem } from '../types/trade';
import {
  X,
  Phone,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Utensils,
  ArrowRightLeft,
  MessageSquare,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface StoreDetailDrawerProps {
  store: Store | null;
  onClose: () => void;
  onOpenProposal: (targetItem: ExchangeItem) => void;
  onOpenChat: (store: Store) => void;
  isMyStore: boolean;
}

export const StoreDetailDrawer: React.FC<StoreDetailDrawerProps> = ({
  store,
  onClose,
  onOpenProposal,
  onOpenChat,
  isMyStore,
}) => {
  if (!store) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:top-20 z-40 md:w-96 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[calc(100vh-120px)] transition-all animate-in slide-in-from-bottom">
      
      {/* Header Banner */}
      <div className="relative h-40 bg-gray-900 flex-shrink-0">
        <img
          src={store.storeImageUrl}
          alt={store.storeName}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Store Title & Badges */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-md">
              {store.categoryName}
            </span>
            {store.isVerified && (
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/90 backdrop-blur text-white px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> 사장님 인증
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight flex items-center justify-between">
            <span>{store.storeName}</span>
            {isMyStore && <span className="text-xs bg-blue-500 px-2 py-0.5 rounded text-white font-normal">👑 우리 가게</span>}
          </h2>
          <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-orange-400" /> {store.address}
          </p>
        </div>
      </div>

      {/* Store Sub-Info */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>브레이크 타임: <strong>{store.breakTimeHours}</strong></span>
        </div>
        <div className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
          store.breakTimeActive
            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {store.breakTimeActive ? '☕ 지금 바꿔먹기 가능!' : '영업 중'}
        </div>
      </div>

      {/* Registered Exchange Items Section */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-orange-500" />
            등록된 바꿔먹기 메뉴 ({store.exchangeItems.length}개)
          </h3>
          <span className="text-xs text-gray-500">1:1 등가교환</span>
        </div>

        {store.exchangeItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            아직 등록된 교환 메뉴가 없습니다.
          </div>
        ) : (
          store.exchangeItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-gray-900 text-sm truncate">
                      {item.title}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-extrabold text-orange-600 bg-orange-50 border border-orange-200 rounded-md whitespace-nowrap ml-2">
                      약 {item.estimatedPrice.toLocaleString()}원
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Proposal Action Button */}
              {!isMyStore && (
                <button
                  onClick={() => onOpenProposal(item)}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  내 메뉴와 바꿔먹기 제안하기
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Footer Action */}
      {!isMyStore && (
        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <button
            onClick={() => onOpenChat(store)}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-orange-400" />
            {store.ownerName}과 1:1 대화하기
          </button>
        </div>
      )}
    </div>
  );
};
