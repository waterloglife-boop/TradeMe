import React, { useState } from 'react';
import { X, ArrowRightLeft, Store, Utensils, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { Store as StoreType, ExchangeItem } from '../types/trade';

interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: StoreType;
  targetItem: ExchangeItem;
  myStore: StoreType;
  onSendProposal: (
    myMenu: ExchangeItem,
    targetMenu: ExchangeItem,
    diffPrice: number,
    pickupTime: string,
    isPoke: boolean,
    message?: string
  ) => void;
}

export const TradeProposalModal: React.FC<TradeProposalModalProps> = ({
  isOpen,
  onClose,
  targetStore,
  targetItem,
  myStore,
  onSendProposal,
}) => {
  const [selectedMyItem, setSelectedMyItem] = useState<ExchangeItem | null>(
    myStore.exchangeItems[0] || null
  );
  const [pickupTime, setPickupTime] = useState('브레이크 타임 (15:00 ~ 16:00)');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const isPoke = !targetStore.breakTimeActive;
  const myPrice = selectedMyItem ? selectedMyItem.estimatedPrice : 0;
  const targetPrice = targetItem.estimatedPrice;
  const priceDiff = targetPrice - myPrice; // > 0 이면 내가 더 냄, < 0 이면 상대가 더 냄

  const handleProposalSubmit = () => {
    if (!selectedMyItem) return;
    onSendProposal(selectedMyItem, targetItem, priceDiff, pickupTime, isPoke, message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-4 text-white ${
          isPoke
            ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800'
            : 'bg-gradient-to-r from-orange-500 to-amber-600'
        }`}>
          <div className="flex items-center gap-2">
            {isPoke ? <span className="text-lg">👉</span> : <ArrowRightLeft className="w-5 h-5" />}
            <div>
              <h2 className="font-bold text-base">
                {isPoke ? '나중에 교환 어때요? (비동기 찔러보기)' : '1:1 물물교환 제안'}
              </h2>
              {isPoke && (
                <p className="text-[11px] text-purple-200">
                  상대 매장 교환 OFF 상태 · 조용히 제안함으로 전달
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Poke Mode Explanation Banner */}
          {isPoke && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2">
              <span className="text-sm flex-shrink-0">💡</span>
              <div className="space-y-0.5">
                <p className="font-extrabold text-indigo-900">비동기 찔러보기(Poke) 제안 모드</p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  상대 매장이 현재 영업 중이거나 교환 OFF 상태입니다. 실시간 방해 알림 없이 <strong>상대 사장님의 제안함(대시보드)</strong>에 조용히 저장되며, 사장님이 여유가 되실 때 수락하실 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Comparison Cards: My Item vs Target Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            
            {/* My Store Menu Selection */}
            <div className="bg-blue-50/60 border-2 border-blue-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <span>👑 내 가게 ({myStore.storeName})</span>
                </div>

                {myStore.exchangeItems.length === 0 ? (
                  <p className="text-xs text-red-500 font-bold py-4 text-center">
                    등록된 내 교환 메뉴가 없습니다. 메뉴를 먼저 등록해 주세요.
                  </p>
                ) : (
                  <select
                    value={selectedMyItem?.id}
                    onChange={(e) => {
                      const item = myStore.exchangeItems.find((i) => i.id === e.target.value);
                      if (item) setSelectedMyItem(item);
                    }}
                    className="w-full text-xs font-bold text-gray-800 bg-white border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {myStore.exchangeItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.estimatedPrice.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
                )}

                {selectedMyItem && (
                  <div className="mt-3 text-xs text-gray-700">
                    <p className="font-bold text-gray-900 line-clamp-1">{selectedMyItem.title}</p>
                    <p className="text-blue-700 font-extrabold text-sm mt-1">
                      {selectedMyItem.estimatedPrice.toLocaleString()} 원
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(selectedMyItem.fulfillmentTypes && selectedMyItem.fulfillmentTypes.length > 0 ? selectedMyItem.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => (
                        <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          {type === 'PICKUP' ? '🛍️ 픽업' : type === 'DELIVERY' ? '🛵 배달' : '🏢 방문'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target Store Menu */}
            <div className="bg-orange-50/60 border-2 border-orange-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-orange-700 mb-1 flex items-center gap-1">
                  <span>🏬 상대 매장 ({targetStore.storeName})</span>
                </div>
                <div className="bg-white border border-orange-300 rounded-lg p-2">
                  <p className="font-bold text-xs text-gray-900 line-clamp-1">{targetItem.title}</p>
                  <p className="text-orange-600 font-extrabold text-sm mt-1">
                    {targetItem.estimatedPrice.toLocaleString()} 원
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(targetItem.fulfillmentTypes && targetItem.fulfillmentTypes.length > 0 ? targetItem.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => (
                      <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 rounded">
                        {type === 'PICKUP' ? '🛍️ 픽업' : type === 'DELIVERY' ? '🛵 배달' : '🏢 방문'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Automatic Price Difference Calculation Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-gray-700">1:1 교환 차액 계산:</span>
                <p className="text-xs text-gray-500">
                  {priceDiff === 0
                    ? '완벽한 1:1 동일 가치 교환입니다!'
                    : priceDiff > 0
                    ? `내가 ${priceDiff.toLocaleString()}원 차액 현금/카드 추가 정산`
                    : `상대 사장님이 ${Math.abs(priceDiff).toLocaleString()}원 차액 추가 정산`}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
              priceDiff === 0
                ? 'bg-emerald-100 text-emerald-800'
                : priceDiff > 0
                ? 'bg-amber-100 text-amber-900'
                : 'bg-blue-100 text-blue-900'
            }`}>
              {priceDiff === 0 ? '차액 0원' : `${Math.abs(priceDiff).toLocaleString()}원`}
            </div>
          </div>

          {/* Desired Exchange / Pickup Time */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              희망 교환 / 픽업 시각
            </label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="브레이크 타임 (15:00 ~ 16:00)">☕ 브레이크 타임 (15:00 ~ 16:00)</option>
              <option value="점심 마감 직후 (14:30)">☀️ 점심 마감 직후 (14:30)</option>
              <option value="저녁 마감 후 (21:30)">🌙 저녁 마감 후 (21:30)</option>
              <option value="언제든 여유 생기실 때 (찔러보기 맞춤)">👉 언제든 여유 생기실 때 (찔러보기 맞춤)</option>
              <option value="사장님과 채팅으로 상의">💬 사장님과 채팅으로 상의</option>
            </select>
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              💬 사장님께 남길 한마디 (선택)
            </label>
            <input
              type="text"
              placeholder={isPoke ? "예: 사장님 오늘 장사 끝나고 저녁에 갈비랑 교환 어떠세요?" : "예: 오늘 15시에 따뜻할 때 바로 교환해요!"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <button
            onClick={handleProposalSubmit}
            disabled={!selectedMyItem}
            className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 ${
              isPoke
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25'
            }`}
          >
            {isPoke ? (
              <>
                <span className="text-base">👉</span>
                <span>나중에 교환 제안 보내기 (비동기 찔러보기)</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>1:1 물물교환 제안 보내기</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

