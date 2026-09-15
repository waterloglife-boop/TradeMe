import React, { useState, useEffect } from 'react';
import { Store, ExchangeItem, MenuTestCampaign } from '../types/trade';
import { fetchMenuTestCampaigns, fetchItemsByStoreId } from '../lib/supabase';
import {
  X,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Utensils,
  ArrowRightLeft,
  MessageSquare,
  ShieldCheck,
  Tag,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface StoreDetailDrawerProps {
  store: Store | null;
  onClose: () => void;
  onOpenProposal: (item: ExchangeItem) => void;
  onOpenChat: (targetStore: Store) => void;
  onOpenMenuTestApply?: (store: Store, campaign?: MenuTestCampaign) => void;
  onOpenMenuTestDashboard?: () => void;
  isMyStore?: boolean;
  onEditStore?: () => void;
}

export const StoreDetailDrawer: React.FC<StoreDetailDrawerProps> = ({
  store,
  onClose,
  onOpenProposal,
  onOpenChat,
  onOpenMenuTestApply,
  onOpenMenuTestDashboard,
  isMyStore,
  onEditStore,
}) => {
  const [campaigns, setCampaigns] = useState<MenuTestCampaign[]>([]);
  const [items, setItems] = useState<ExchangeItem[]>(store?.exchangeItems || []);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (store?.id && store.isMenuTesting) {
      fetchMenuTestCampaigns(store.id).then((data) => {
        setCampaigns(data || []);
      });
    } else {
      setCampaigns([]);
    }
  }, [store?.id, store?.isMenuTesting]);

  // Supabase items 테이블 실시간 동기화 (화면에 품목이 비어 보이는 문제 완벽 차단)
  useEffect(() => {
    let isCancelled = false;
    setItems(store?.exchangeItems || []);

    if (store?.id) {
      setLoadingItems(true);
      fetchItemsByStoreId(store.id)
        .then((fetched) => {
          if (!isCancelled && fetched && fetched.length > 0) {
            setItems(fetched);
          }
        })
        .finally(() => {
          if (!isCancelled) setLoadingItems(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [store?.id, store?.exchangeItems]);

  if (!store) return null;

  const getFeedbackBadge = (type?: string) => {
    switch (type) {
      case 'BLOG_SNS':
        return '📱 SNS/블로그 후기';
      case 'SECRET_REPORT':
        return '🔒 1:1 비밀 피드백';
      case 'BOTH':
      default:
        return '🌟 SNS후기 + 1:1 비밀피드백';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:top-20 z-50 md:w-96 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[75vh] md:max-h-[calc(100vh-120px)] transition-all animate-in slide-in-from-bottom pb-safe md:pb-0">
      
      {/* Mobile Top Drag / Grab Bar Handle */}
      <div 
        onClick={onClose}
        className="w-full flex items-center justify-center pt-2 pb-1 md:hidden bg-gray-950/80 backdrop-blur-sm cursor-pointer"
        title="탭하여 닫기"
      >
        <div className="w-10 h-1 bg-white/60 rounded-full" />
      </div>

      {/* Header Banner */}
      <div className="relative h-36 sm:h-44 bg-gray-900 flex-shrink-0">
        <img
          src={store.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'}
          alt={store.storeName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
          }}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Store Title & Badges */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-md shadow-sm">
              {store.categoryName}
            </span>
            {store.isVerified && (
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/90 backdrop-blur text-white px-2 py-0.5 rounded-md shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> 사장님 인증
              </span>
            )}
            {store.isMenuTesting && (
              <span className="flex items-center gap-1 text-[11px] font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                <span>🧪</span> 신메뉴 시식단 모집중
              </span>
            )}
          </div>
          
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight truncate flex items-center gap-2">
                <span>{store.storeName}</span>
                {isMyStore && <span className="text-xs bg-blue-500 px-2 py-0.5 rounded text-white font-normal">👑 우리 가게</span>}
              </h2>
              <p className="text-xs text-gray-300 font-medium flex items-center gap-1 mt-0.5">
                <span>{store.ownerName} 사장님</span>
                <span className="text-gray-500">·</span>
                <MapPin className="w-3 h-3 text-orange-400 flex-shrink-0" />
                <span className="truncate">{store.address}</span>
              </p>
            </div>

            {/* Thumbnail avatar pill */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg flex-shrink-0 bg-gray-800">
              <img
                src={store.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'}
                alt={store.storeName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Store Sub-Info */}
      <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-200 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>영업시간: <strong>{store.breakTimeHours || '10:00 - 22:00'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            🤝 교환 성사 {store.tradeCount || 0}회
          </span>
          <div className={`px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap ${
            store.breakTimeActive
              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
              : 'bg-gray-200 text-gray-700'
          }`}>
            {store.breakTimeActive ? '☕ 지금 1:1 물물교환 가능!' : '영업 중'}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        
        {/* 📢 가게 소개 & 사장님 한마디 (더미 정보 없이 실제 등록된 내용만 노출) */}
        {store.description && store.description.trim() ? (
          <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <span className="text-sm">📢</span>
                <span>가게 소개</span>
              </span>
              {isMyStore && onEditStore && (
                <button
                  type="button"
                  onClick={onEditStore}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-200/60 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  ✏️ 소개 수정
                </button>
              )}
            </div>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line font-medium break-keep">
              {store.description.trim()}
            </p>
          </div>
        ) : isMyStore ? (
          <div className="bg-amber-50/60 border border-dashed border-amber-300 rounded-2xl p-3 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1">
                <span>📢</span> 우리 가게 소개글을 등록해 보세요!
              </span>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                이웃 사장님들에게 매장의 장점과 인사말을 전할 수 있습니다.
              </p>
            </div>
            {onEditStore && (
              <button
                type="button"
                onClick={onEditStore}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                + 소개 작성
              </button>
            )}
          </div>
        ) : null}

        {/* 🧪 Highlighted Menu Test Campaign Card(s) - Up to 2 concurrent campaigns */}
        {store.isMenuTesting && (
          <div className="space-y-3">
            {campaigns.filter((c) => c.status === 'RECRUITING').length > 0 ? (
              campaigns
                .filter((c) => c.status === 'RECRUITING')
                .map((camp, idx) => (
                  <div
                    key={camp.id}
                    className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-4 shadow-lg border border-purple-400/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-500 text-white rounded-full flex items-center gap-1 shadow-sm">
                        <span>🧪</span> {idx === 0 ? '1호' : '2호'} 시식단 / 서포터즈 모집
                      </span>
                      <span className="text-[11px] font-bold text-purple-200">
                        정원 {camp.quota}명
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                        {camp.title}
                      </h3>
                      {camp.description && (
                        <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                          {camp.description}
                        </p>
                      )}
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-xs space-y-1.5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300">🎁 제공 혜택</span>
                        <span className="font-bold text-white text-right">{camp.reward}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-purple-300">📝 피드백 조건</span>
                        <span className="font-bold text-purple-200">{getFeedbackBadge(camp.feedbackType)}</span>
                      </div>
                    </div>

                    {!isMyStore ? (
                      <button
                        onClick={() => onOpenMenuTestApply && onOpenMenuTestApply(store, camp)}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-gray-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <span>🧪</span>
                        <span>{camp.title} 신청하기</span>
                      </button>
                    ) : null}
                  </div>
                ))
            ) : (
              <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-4 shadow-lg border border-purple-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-500 text-white rounded-full flex items-center gap-1 shadow-sm">
                    <span>🧪</span> 신메뉴 시식단 / 서포터즈 모집
                  </span>
                  <span className="text-[11px] font-bold text-purple-200">
                    정원 {store.menuTestQuota || 5}명
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                    {store.menuTestTitle || '가을 신메뉴 1호 시식단'}
                  </h3>
                  {store.menuTestDescription && (
                    <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                      {store.menuTestDescription}
                    </p>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-xs space-y-1.5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">🎁 제공 혜택</span>
                    <span className="font-bold text-white text-right">{store.menuTestReward || '신메뉴 2인 무료 시식'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-purple-300">📝 피드백 조건</span>
                    <span className="font-bold text-purple-200">{getFeedbackBadge(store.menuTestFeedbackType)}</span>
                  </div>
                </div>

                {!isMyStore && (
                  <button
                    onClick={() => onOpenMenuTestApply && onOpenMenuTestApply(store)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-gray-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span>🧪</span>
                    <span>시식단 신청하기</span>
                  </button>
                )}
              </div>
            )}

            {isMyStore && (
              <div className="space-y-2">
                <div className="text-center text-[11px] text-purple-700 bg-purple-50 py-1.5 rounded-lg border border-purple-200 font-bold">
                  👑 내가 모집 중인 신메뉴 테스트 캠페인입니다
                </div>
                {onOpenMenuTestDashboard && (
                  <button
                    onClick={onOpenMenuTestDashboard}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span>📋</span>
                    <span>접수된 체험단 신청서 관리 대시보드</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Separate voucher item from regular signature items (사장님이 직접 등록/활성화한 경우에만 노출) */}
        {(() => {
          const voucherItem = (items || []).find(
            (it) => it.isVoucher || it.type === 'VOUCHER' || it.id.startsWith('voucher-')
          ) || (store.voucherActive ? {
            id: `voucher-${store.id}`,
            storeId: store.id,
            title: `${store.storeName} ${(store.voucherAmount || 30000).toLocaleString()}원 상생 이용권`,
            estimatedPrice: store.voucherAmount || 30000,
            description: '전 메뉴 및 서비스 자유 선택 이용 (초과 금액 차액 결제 가능)',
            type: 'VOUCHER' as const,
            imageUrl: store.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
            isAvailable: true,
            fulfillmentTypes: store.voucherFulfillmentTypes || ['PICKUP', 'ON_SITE'],
            isVoucher: true,
          } : null);

          const regularItems = (items || []).filter(
            (it) => !it.isVoucher && it.type !== 'VOUCHER' && !it.id.startsWith('voucher-')
          );

          return (
            <div className="space-y-4">
              {/* 🎟️ VIP Golden Ticket Voucher Card (사장님이 직접 등록/발행한 경우에만 노출) */}
              {voucherItem && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white p-4 shadow-xl border-2 border-amber-300/40 space-y-3">
                  {/* Decorative ambient glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-black bg-black/25 backdrop-blur rounded-full text-amber-200 border border-amber-300/30 flex items-center gap-1">
                        <span>🎟️</span> VIP 상생 금액 교환권
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full">
                        D-30
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-100 flex items-center gap-1">
                      <span>🛡️</span> 한도 5장
                    </span>
                  </div>

                  {/* Ticket Body */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <h3 className="font-black text-lg text-white tracking-tight leading-snug">
                        {store.storeName} 자유이용 상품권
                      </h3>
                      <p className="text-xs text-amber-100 mt-0.5">
                        전 메뉴 / 서비스 자유 선택 (초과 금액 차액 결제)
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-2xl font-black text-yellow-200 drop-shadow-sm">
                        {(voucherItem.estimatedPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-black text-white ml-0.5">원</span>
                    </div>
                  </div>

                  {/* Fulfillment badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/20">
                    <span className="text-[10px] text-amber-200 font-bold mr-1">이용 방식:</span>
                    {(voucherItem.fulfillmentTypes && voucherItem.fulfillmentTypes.length > 0 ? voucherItem.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => {
                      if (type === 'PICKUP') {
                        return (
                          <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-black/20 text-white rounded-md border border-white/10">
                            🛍️ 직접 픽업
                          </span>
                        );
                      }
                      if (type === 'DELIVERY') {
                        return (
                          <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-black/20 text-white rounded-md border border-white/10">
                            🛵 배달/배송
                          </span>
                        );
                      }
                      if (type === 'ON_SITE') {
                        return (
                          <span key={type} className="px-2 py-0.5 text-[10px] font-extrabold bg-black/20 text-white rounded-md border border-white/10">
                            🏢 현장 방문
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Voucher Action Button */}
                  {!isMyStore ? (
                    <button
                      onClick={() => onOpenProposal(voucherItem)}
                      className="w-full py-2.5 font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-gray-950 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 hover:from-yellow-200 hover:to-yellow-300"
                    >
                      <span>🎟️</span>
                      <span>
                        {store.breakTimeActive
                          ? `1:1 금액 교환권 (${(voucherItem.estimatedPrice || 0).toLocaleString()}원) 맞교환 제안`
                          : `나중에 금액권 교환 어때요? (찔러보기)`}
                      </span>
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-amber-100 bg-black/20 py-1.5 rounded-lg font-bold border border-white/10">
                      👑 우리 매장이 발행 중인 상생 금액 교환권입니다
                    </div>
                  )}
                </div>
              )}

              {/* 📦 Regular Exchange Items Section */}
              {loadingItems && regularItems.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span className="text-xs">교환 품목 실시간 로딩 중...</span>
                </div>
              ) : regularItems.length === 0 ? (
                voucherItem ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-1.5">
                    <h4 className="font-bold text-xs text-gray-700">단품 메뉴 준비 중</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      상단의 발행된 <strong>[{voucherItem.title}]</strong>으로 맞교환을 제안하시거나, 1:1 대화로 문의해 보세요!
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-gray-400 text-xl border border-gray-200 shadow-2xs">
                      ☕
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800">아직 등록된 교환 품목이 없습니다</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        사장님이 가입 후 매장 분위기를 둘러보고 계십니다.<br />
                        궁금한 점이나 교환 희망 사항이 있다면 1:1 대화로 먼저 편하게 소통해 보세요!
                      </p>
                    </div>
                    {!isMyStore && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(store)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-gray-800 transition-all active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                        <span>{store.storeName} 사장님과 1:1 대화하기</span>
                      </button>
                    )}
                  </div>
                )
              ) : (
                regularItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-3 hover:border-orange-300 transition-all"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                        alt={item.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {item.title}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-extrabold text-orange-600 bg-orange-50 border border-orange-200 rounded-md whitespace-nowrap ml-2">
                            약 {(item.estimatedPrice || (item as any).estimatedValue || 0).toLocaleString()}원
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {item.description}
                        </p>

                        {/* Fulfillment Badges (제공 및 이용 방식) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {(item.fulfillmentTypes && item.fulfillmentTypes.length > 0 ? item.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => {
                            if (type === 'PICKUP') {
                              return (
                                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 rounded-md">
                                  <span>🛍️</span>
                                  <span>직접 픽업</span>
                                </span>
                              );
                            }
                            if (type === 'DELIVERY') {
                              return (
                                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                  <span>🛵</span>
                                  <span>배달/배송</span>
                                </span>
                              );
                            }
                            if (type === 'ON_SITE') {
                              return (
                                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                                  <span>🏢</span>
                                  <span>현장 방문 이용</span>
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Proposal Action Button (Chameleon Button based on breakTimeActive) */}
                    {!isMyStore && (
                      <button
                        onClick={() => onOpenProposal(item)}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-white ${
                          store.breakTimeActive
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20'
                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/20'
                        }`}
                      >
                        {store.breakTimeActive ? (
                          <>
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>🤝 1:1 물물교환 제안하기</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">👉</span>
                            <span>나중에 교환 어때요? (찔러보기)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </div>

      {/* Bottom Footer Action */}
      {!isMyStore && (
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <button
            onClick={() => onOpenChat(store)}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <span>{store.storeName} ({store.ownerName} 사장님)과 1:1 대화하기</span>
          </button>
        </div>
      )}
    </div>
  );
};
