import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Store, Utensils, CheckCircle, Clock, AlertCircle, Sparkles, Ticket } from 'lucide-react';
import { Store as StoreType, ExchangeItem } from '../types/trade';
import { fetchStoredVouchers } from '../lib/supabase';

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
    message?: string,
    tradeType?: 'VOUCHER' | 'DIRECT',
    tradeFulfillment?: string
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
  // Regular menu/service items
  const regularItems = (myStore.exchangeItems || []).filter(
    (it) => !it.isVoucher && it.type !== 'VOUCHER' && !it.id.startsWith('voucher-')
  );

  // VIP Win-Win Amount Voucher Item
  const myVoucherItem: ExchangeItem = (myStore.exchangeItems || []).find(
    (it) => it.isVoucher || it.type === 'VOUCHER' || it.id.startsWith('voucher-')
  ) || {
    id: `voucher-${myStore.id || 'my-store'}`,
    storeId: myStore.id,
    title: `🎟️ [상생 금액권] ${myStore.storeName} ${(myStore.voucherAmount || 20000).toLocaleString()}원 상품권`,
    estimatedPrice: myStore.voucherAmount || 20000,
    description: '전 메뉴 및 서비스 자유 선택 이용 (초과 금액 차액 결제)',
    type: 'VOUCHER',
    imageUrl:
      myStore.storeImageUrl ||
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    fulfillmentTypes: myStore.voucherFulfillmentTypes || ['PICKUP', 'ON_SITE'],
    isVoucher: true,
  };

  const selectableItems = [...regularItems, myVoucherItem];

  const [selectedMyItem, setSelectedMyItem] = useState<ExchangeItem | null>(() => {
    if (targetItem.isVoucher || targetItem.type === 'VOUCHER') {
      return myVoucherItem;
    }
    return regularItems[0] || myVoucherItem;
  });

  const [fulfillmentMethod, setFulfillmentMethod] = useState<string>('🎟️ 상생 교환권(모바일 쿠폰) 즉시 맞발행');
  const [pickupTime, setPickupTime] = useState('브레이크 타임 (15:00 ~ 16:00)');
  const [message, setMessage] = useState('');

  // Check wallet capacity (Safety limit: 5 vouchers)
  const [walletAvailableCount, setWalletAvailableCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const activeVouchers = fetchStoredVouchers(myStore.id).filter((v) => v.status === 'AVAILABLE');
      setWalletAvailableCount(activeVouchers.length);

      if (targetItem.isVoucher || targetItem.type === 'VOUCHER') {
        setSelectedMyItem(myVoucherItem);
      } else {
        setSelectedMyItem(regularItems[0] || myVoucherItem);
      }
    }
  }, [isOpen, targetItem, myStore.id]);

  if (!isOpen) return null;

  const isPoke = !targetStore.breakTimeActive;
  const myPrice = selectedMyItem ? selectedMyItem.estimatedPrice : 0;
  const targetPrice = targetItem.estimatedPrice;
  const priceDiff = targetPrice - myPrice; // > 0 이면 내가 더 냄, < 0 이면 상대가 더 냄
  const isVoucherTrade =
    fulfillmentMethod.includes('교환권') ||
    selectedMyItem?.isVoucher ||
    targetItem?.isVoucher ||
    selectedMyItem?.type === 'VOUCHER' ||
    targetItem?.type === 'VOUCHER';

  const handleProposalSubmit = () => {
    if (!selectedMyItem) return;
    onSendProposal(
      selectedMyItem,
      targetItem,
      priceDiff,
      pickupTime,
      isPoke,
      message,
      isVoucherTrade ? 'VOUCHER' : 'DIRECT',
      fulfillmentMethod
    );
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
                <div className="text-[11px] font-bold text-blue-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">👑 내 매장 ({myStore.storeName})</span>
                  <span className="text-[10px] text-blue-500 font-semibold">제공할 품목</span>
                </div>

                <select
                  value={selectedMyItem?.id}
                  onChange={(e) => {
                    const item = selectableItems.find((i) => i.id === e.target.value);
                    if (item) setSelectedMyItem(item);
                  }}
                  className="w-full text-xs font-bold text-gray-800 bg-white border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {selectableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.isVoucher || item.type === 'VOUCHER'
                        ? `🎟️ [금액권] ${item.title}`
                        : `🍽️ [대표메뉴] ${item.title} (${item.estimatedPrice.toLocaleString()}원)`}
                    </option>
                  ))}
                </select>

                {selectedMyItem && (
                  <div className="mt-2.5 text-xs text-gray-700 bg-white/80 p-2 rounded-lg border border-blue-100">
                    <p className="font-extrabold text-gray-900 line-clamp-1">{selectedMyItem.title}</p>
                    <p className="text-blue-700 font-black text-sm mt-0.5">
                      {selectedMyItem.estimatedPrice.toLocaleString()} 원
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(selectedMyItem.fulfillmentTypes && selectedMyItem.fulfillmentTypes.length > 0
                        ? selectedMyItem.fulfillmentTypes
                        : ['PICKUP', 'ON_SITE']
                      ).map((type) => (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded"
                        >
                          {type === 'PICKUP' ? '🛍️ 직접 픽업' : type === 'DELIVERY' ? '🛵 배달' : '🏢 현장 방문'}
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
                <div className="text-[11px] font-bold text-orange-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">🏬 상대 매장 ({targetStore.storeName})</span>
                  <span className="text-[10px] text-orange-500 font-semibold">받고 싶은 품목</span>
                </div>
                <div className="bg-white border border-orange-300 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    {targetItem.isVoucher || targetItem.type === 'VOUCHER' ? (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[9px] font-black">
                        🎟️ 상생 금액권
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[9px] font-bold">
                        🍽️ 대표 메뉴
                      </span>
                    )}
                  </div>
                  <p className="font-extrabold text-xs text-gray-900 line-clamp-1">{targetItem.title}</p>
                  <p className="text-orange-600 font-black text-sm mt-0.5">
                    {targetItem.estimatedPrice.toLocaleString()} 원
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(targetItem.fulfillmentTypes && targetItem.fulfillmentTypes.length > 0
                      ? targetItem.fulfillmentTypes
                      : ['PICKUP', 'ON_SITE']
                    ).map((type) => (
                      <span
                        key={type}
                        className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 rounded"
                      >
                        {type === 'PICKUP' ? '🛍️ 직접 픽업' : type === 'DELIVERY' ? '🛵 배달' : '🏢 현장 방문'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Automatic Price Difference Calculation Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-gray-700">1:1 등가 교환 차액:</span>
                <p className="text-[11px] text-gray-500">
                  {priceDiff === 0
                    ? '동일 가치 1:1 완벽 교환!'
                    : priceDiff > 0
                    ? `내가 ${priceDiff.toLocaleString()}원 차액 정산`
                    : `상대 사장님이 ${Math.abs(priceDiff).toLocaleString()}원 차액 정산`}
                </p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                priceDiff === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : priceDiff > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              {priceDiff === 0 ? '차액 0원' : `${Math.abs(priceDiff).toLocaleString()}원`}
            </div>
          </div>

          {/* Fulfillment / Exchange Method Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🔄</span> 이용 및 전달 방식 (쿠폰 발행 여부)
              </span>
              <span className="text-[10px] text-orange-600 font-bold">1:1 맞교환 방식</span>
            </label>
            <select
              value={fulfillmentMethod}
              onChange={(e) => setFulfillmentMethod(e.target.value)}
              className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="🎟️ 상생 교환권(모바일 쿠폰) 즉시 맞발행">
                🎟️ 상생 교환권(모바일 쿠폰) 즉시 맞발행 (수락 시 양측 보관함에 자동 발급 · D-30)
              </option>
              <option value="🛍️ 직접 방문 픽업 교환">🛍️ 직접 방문 픽업 교환</option>
              <option value="🏢 현장 매장 방문 이용 교환">🏢 현장 매장 방문 이용 교환</option>
              <option value="🛵 배달 / 배송 교환">🛵 배달 / 배송 교환</option>
            </select>
          </div>

          {/* Voucher Issuance Feature Callout */}
          {isVoucherTrade && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[11px]">
                <span>🎟️</span>
                <span>양방향 상생 교환권 자동 동시 발급 시스템</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                상대 사장님이 제안을 수락하는 즉시, <strong>양 매장의 [교환권 보관함]</strong>으로 유효기간 30일의 1:1 맞교환 쿠폰이 0.1초 만에 상호 자동 발급됩니다.
              </p>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-amber-200/60 flex items-center gap-1">
                <span>🛡️</span>
                <span>플랫폼은 통신판매중개자로서 회원 간 교환권의 자율 발행을 지원하며 별도의 지급보증을 제공하지 않습니다.</span>
              </p>
            </div>
          )}

          {/* Wallet Safety Capacity Status (Max 5) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-gray-700 font-medium">내 보관함 보유 수량:</span>
              <strong className="text-gray-900">{walletAvailableCount} / 5장</strong>
            </div>
            {walletAvailableCount >= 5 ? (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold text-[10px]">
                ⚠️ 보관함 가득 참
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                🛡️ 수령 여유 {5 - walletAvailableCount}장
              </span>
            )}
          </div>

          {walletAvailableCount >= 5 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700">
              💡 현재 보관함이 가득 차 있어, 기존 교환권을 먼저 사용 완료하셔야 신규 교환권을 수령하실 수 있습니다.
            </div>
          )}

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
              placeholder={
                isPoke
                  ? '예: 사장님 오늘 장사 끝나고 저녁에 교환권 맞교환 어떠세요?'
                  : '예: 수락해 주시면 30일 동안 편하실 때 바로 교환해요!'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <button
            onClick={handleProposalSubmit}
            disabled={!selectedMyItem || walletAvailableCount >= 5}
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

