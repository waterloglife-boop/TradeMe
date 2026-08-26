import React, { useState } from 'react';
import { X, ArrowRightLeft, Store, Utensils, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Store as StoreType, ExchangeItem } from '../types/trade';

interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: StoreType;
  targetItem: ExchangeItem;
  myStore: StoreType;
  onSendProposal: (myMenu: ExchangeItem, targetMenu: ExchangeItem, diffPrice: number, pickupTime: string) => void;
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

  if (!isOpen) return null;

  const myPrice = selectedMyItem ? selectedMyItem.estimatedPrice : 0;
  const targetPrice = targetItem.estimatedPrice;
  const priceDiff = targetPrice - myPrice; // > 0 이면 내가 더 냄, < 0 이면 상대가 더 냄

  const handleProposalSubmit = () => {
    if (!selectedMyItem) return;
    onSendProposal(selectedMyItem, targetItem, priceDiff, pickupTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            <h2 className="font-bold text-base">
              1:1 등가교환 바꿔먹기 제안
            </h2>
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
              원하는 교환/픽업 시각
            </label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="브레이크 타임 (15:00 ~ 16:00)">☕ 브레이크 타임 (15:00 ~ 16:00)</option>
              <option value="점심 마감 직후 (14:30)">☀️ 점심 마감 직후 (14:30)</option>
              <option value="저녁 마감 후 (21:30)">🌙 저녁 마감 후 (21:30)</option>
              <option value="사장님과 채팅으로 상의">💬 사장님과 채팅으로 상의</option>
            </select>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleProposalSubmit}
            disabled={!selectedMyItem}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            1:1 바꿔먹기 제안 채팅 보내기
          </button>

        </div>
      </div>
    </div>
  );
};
