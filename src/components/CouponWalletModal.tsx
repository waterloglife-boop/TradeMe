import React, { useState, useEffect, useRef } from 'react';
import { X, Ticket, CheckCircle2, Clock, AlertCircle, RotateCcw, Sparkles, ChevronRight, ShieldCheck, ArrowRight, Store as StoreIcon, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { Store, IssuedVoucher } from '../types/trade';
import { fetchStoredVouchers, fetchVouchersFromSupabase, redeemVoucherInStorage, restoreVoucherInStorage, deleteVoucherFromStorage } from '../lib/supabase';

interface CouponWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  onExploreStores?: () => void;
  onWalletUpdate?: () => void;
}

export const CouponWalletModal: React.FC<CouponWalletModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onExploreStores,
  onWalletUpdate,
}) => {
  const [vouchers, setVouchers] = useState<IssuedVoucher[]>([]);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'HISTORY'>('AVAILABLE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!myStore?.id || myStore.id === 'my_store') {
        setVouchers([]);
        return;
      }
      const list = fetchStoredVouchers(myStore.id, myStore.storeName);
      setVouchers(list);
      setToastMessage(null);

      // ☁️ Synchronize latest vouchers from Supabase cloud in real-time
      fetchVouchersFromSupabase(myStore.id).then((cloudList) => {
        setVouchers(cloudList || []);
        onWalletUpdate?.();
      });
    }
  }, [isOpen, myStore?.id, myStore?.storeName]);

  if (!isOpen) return null;

  const availableVouchers = vouchers.filter((v) => v.status === 'AVAILABLE');
  const historyVouchers = vouchers.filter((v) => v.status !== 'AVAILABLE');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRedeem = (voucherId: string) => {
    const res = redeemVoucherInStorage(voucherId);
    if (res.success) {
      const updated = fetchStoredVouchers(myStore.id, myStore.storeName);
      setVouchers(updated);
      showToast(`🎉 "${res.voucher?.title}" 사용이 완료되었습니다!`);
      onWalletUpdate?.();
    } else {
      showToast(res.error || '사용 처리에 실패했습니다.');
    }
  };

  const handleRestore = (voucherId: string) => {
    const res = restoreVoucherInStorage(voucherId);
    if (res.success) {
      const updated = fetchStoredVouchers(myStore.id, myStore.storeName);
      setVouchers(updated);
      showToast(`↩️ "${res.voucher?.title}"이(가) 다시 사용 가능으로 복원되었습니다.`);
      onWalletUpdate?.();
    } else {
      showToast(res.error || '복원에 실패했습니다.');
    }
  };

  const handleDeleteVoucher = (voucherId: string) => {
    if (!confirm('이 교환권 내역을 영구 삭제하시겠습니까?')) return;
    deleteVoucherFromStorage(voucherId);
    const updated = fetchStoredVouchers(myStore.id, myStore.storeName);
    setVouchers(updated);
    showToast('🗑️ 교환권 내역이 삭제되었습니다.');
    onWalletUpdate?.();
  };

  // Helper for D-Day calculation
  const getDDay = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🎟️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  내 교환권 보관함
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  availableVouchers.length >= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-orange-800'
                }`}>
                  보유 {availableVouchers.length} / 5장
                </span>
              </div>
              <p className="text-[11px] text-amber-100">
                {myStore.storeName} ({myStore.ownerName} 사장님)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-2">
          <button
            onClick={() => setActiveTab('AVAILABLE')}
            className={`flex-1 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'AVAILABLE'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>사용 가능</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'AVAILABLE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {availableVouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>사용 및 만료 내역</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'HISTORY' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {historyVouchers.length}
            </span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-4 mt-3 bg-gradient-to-r from-gray-900 to-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-lg border border-amber-400/40 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

        {/* Scrollable Content Stream */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-gray-50/60">
          
          {/* Safe Capacity Policy Pill */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-amber-950">
                  안심 보관 한도 안내 (동시 최대 5장)
                </p>
                <span className="font-black text-orange-700">{availableVouchers.length}/5장</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                상대방이 교환권을 바로 사용하지 않더라도 추가 교환이 원활하도록 이웃 사장님들의 교환권은 <strong>최대 5장까지 동시 보관</strong>됩니다. 사용 완료 시 새로운 교환권을 제안받을 수 있습니다.
              </p>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: 사용 가능 교환권 목록                                     */}
          {/* ================================================================= */}
          {activeTab === 'AVAILABLE' && (
            <div className="space-y-4">
              {availableVouchers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-6 space-y-3 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center text-2xl shadow-inner">
                    🎟️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">보관된 교환권이 없습니다</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      이웃 매장을 둘러보고 1:1 맞교환 또는 금액 교환권을 제안해 보세요!
                    </p>
                  </div>
                  {onExploreStores && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExploreStores();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:from-orange-600 hover:to-amber-700 transition-all active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <StoreIcon className="w-3.5 h-3.5" />
                      <span>이웃 매장 지도 둘러보기</span>
                    </button>
                  )}
                </div>
              ) : (
                availableVouchers.map((voucher) => {
                  const dDay = getDDay(voucher.expiresAt);
                  const isUrgent = dDay <= 7;

                  return (
                    <VoucherCard
                      key={voucher.id}
                      voucher={voucher}
                      dDay={dDay}
                      isUrgent={isUrgent}
                      onRedeem={handleRedeem}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: 사용 및 만료 내역                                         */}
          {/* ================================================================= */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              {historyVouchers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-6 text-gray-400 text-xs">
                  사용 또는 만료된 교환권 내역이 없습니다.
                </div>
              ) : (
                historyVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2.5 opacity-85 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={voucher.senderStoreImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'}
                          alt={voucher.senderStoreName}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0 grayscale"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-gray-900">
                              {voucher.senderStoreName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              ({voucher.senderOwnerName} 사장님)
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-gray-600 line-through">
                            {voucher.title}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-gray-100 text-gray-600">
                          {voucher.status === 'USED' ? '사용 완료' : '기간 만료'}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">
                          {voucher.amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* Used Date & Emergency Restore Button */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {voucher.usedAt
                          ? `사용 일시: ${new Date(voucher.usedAt).toLocaleString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : `만료 일자: ${new Date(voucher.expiresAt).toLocaleDateString('ko-KR')}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {voucher.status === 'USED' && (
                          <button
                            type="button"
                            onClick={() => handleRestore(voucher.id)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 active:scale-95"
                            title="실수로 사용 완료를 누른 경우 복원합니다"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-600" />
                            <span>사용 복원</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="교환권 내역 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 🛡️ 통신판매중개자 법적 고지 (전자상거래법 제20조 제2항 준수) */}
          <div className="p-3 bg-gray-100/80 border border-gray-200/80 rounded-2xl text-[11px] text-gray-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-700">
              <ShieldAlert className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span>통신판매중개자 및 교환권 면책 안내</span>
            </div>
            <p className="leading-relaxed">
              트레이드미는 통신판매중개자로서 교환권의 발행 당사자가 아니며, 본 교환권은 각 가맹점 사장님들의 책임 하에 자율 발행되었습니다. 특정 업체의 폐업, 부도, 채무불이행 시 플랫폼은 지급보증 의무를 부담하지 않습니다.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-gray-500 font-medium">
            💡 매장 방문 또는 배달/픽업 시 사장님께 바우처를 제시해 주세요.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow transition active:scale-95"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};

// =========================================================================
// Sub-component: Individual Active Voucher Card with Slide-to-Redeem
// =========================================================================
interface VoucherCardProps {
  voucher: IssuedVoucher;
  dDay: number;
  isUrgent: boolean;
  onRedeem: (voucherId: string) => void;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  dDay,
  isUrgent,
  onRedeem,
}) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxDrag = 220; // Maximum slide width in pixels

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left - 24;
    const clamped = Math.max(0, Math.min(maxDrag, currentX));
    setSliderPos(clamped);

    // If dragged >= 85%, complete redemption!
    if (clamped >= maxDrag * 0.85) {
      setIsDragging(false);
      setSliderPos(0);
      onRedeem(voucher.id);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap back if not reached
    setSliderPos(0);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-md overflow-hidden relative transition-all hover:border-orange-400">
      
      {/* Top Ticket Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-black bg-black/25 backdrop-blur rounded-full text-amber-200 border border-amber-300/30">
            {voucher.type === 'AMOUNT' ? '🎟️ 상생 금액권' : '🍱 메뉴 교환권'}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full flex items-center gap-1 ${
            isUrgent ? 'bg-red-600 text-white animate-pulse' : 'bg-black/20 text-white'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{dDay > 0 ? `D-${dDay}` : '오늘 마감'}</span>
          </span>
        </div>

        <span className="text-[10px] font-extrabold text-amber-100">
          발행일로부터 30일 유효
        </span>
      </div>

      {/* Ticket Body Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={voucher.senderStoreImageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
              alt={voucher.senderStoreName}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-200 shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-gray-900">
                  {voucher.senderStoreName}
                </h4>
                <span className="text-[11px] text-gray-500 font-bold">
                  ({voucher.senderOwnerName} 사장님)
                </span>
              </div>
              <h5 className="font-black text-sm text-orange-700 mt-0.5">
                {voucher.title}
              </h5>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xl font-black text-gray-900">
              {voucher.amount.toLocaleString()}
            </span>
            <span className="text-xs font-black text-gray-500 ml-0.5">원</span>
          </div>
        </div>

        {voucher.description && (
          <p className="text-xs text-gray-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 leading-relaxed">
            {voucher.description}
          </p>
        )}

        {/* Fulfillment Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-gray-400">제공 방식:</span>
          {(voucher.fulfillmentTypes && voucher.fulfillmentTypes.length > 0 ? voucher.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => {
            if (type === 'PICKUP') {
              return (
                <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 rounded-md">
                  🛍️ 직접 픽업
                </span>
              );
            }
            if (type === 'DELIVERY') {
              return (
                <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  🛵 배달/배송
                </span>
              );
            }
            if (type === 'ON_SITE') {
              return (
                <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  🏢 현장 방문 이용
                </span>
              );
            }
            return null;
          })}
        </div>

        {/* Slide-to-Redeem Interactive Track */}
        <div className="pt-2">
          <div className="text-center text-[10px] font-bold text-amber-900 mb-1.5 flex items-center justify-center gap-1">
            <span>👇</span>
            <span>매장 방문 시 사장님 앞에서 오른쪽으로 밀어주세요</span>
          </div>

          <div
            ref={trackRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-12 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-200 rounded-2xl border-2 border-amber-300 flex items-center select-none overflow-hidden touch-none"
          >
            {/* Track Helper Label */}
            <div className="w-full text-center text-[11px] font-black text-amber-900/70 tracking-wider flex items-center justify-center gap-1 pointer-events-none">
              <span>오른쪽으로 밀어서 사용 완료</span>
              <span className="animate-pulse">❯❯❯</span>
            </div>

            {/* Draggable Slider Handle */}
            <div
              onPointerDown={handlePointerDown}
              style={{ transform: `translateX(${sliderPos}px)` }}
              className="absolute left-1 top-1 bottom-1 w-11 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md flex items-center justify-center text-white cursor-grab active:cursor-grabbing font-black text-sm transition-transform duration-75 active:scale-95"
            >
              🎟️
            </div>
          </div>

          {/* Fallback Single Click for accessibility */}
          <div className="text-center mt-1">
            <button
              type="button"
              onClick={() => {
                if (confirm(`[${voucher.title}]\n\n이 교환권을 사용 완료 처리하시겠습니까?`)) {
                  onRedeem(voucher.id);
                }
              }}
              className="text-[10px] text-gray-400 hover:text-orange-600 underline font-medium"
            >
              밀기가 잘 안 되시나요? (클릭하여 사용)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
