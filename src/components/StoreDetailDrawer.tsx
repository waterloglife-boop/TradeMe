import React, { useState, useEffect } from 'react';
import { Store, ExchangeItem, MenuTestCampaign } from '../types/trade';
import { fetchMenuTestCampaigns } from '../lib/supabase';
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
  Tag,
  Sparkles
} from 'lucide-react';

interface StoreDetailDrawerProps {
  store: Store | null;
  onClose: () => void;
  onOpenProposal: (item: ExchangeItem) => void;
  onOpenChat: (targetStore: Store) => void;
  onOpenMenuTestApply?: (store: Store, campaign?: MenuTestCampaign) => void;
  onOpenMenuTestDashboard?: () => void;
  isMyStore?: boolean;
}

export const StoreDetailDrawer: React.FC<StoreDetailDrawerProps> = ({
  store,
  onClose,
  onOpenProposal,
  onOpenChat,
  onOpenMenuTestApply,
  onOpenMenuTestDashboard,
  isMyStore,
}) => {
  const [campaigns, setCampaigns] = useState<MenuTestCampaign[]>([]);

  useEffect(() => {
    if (store?.id && store.isMenuTesting) {
      fetchMenuTestCampaigns(store.id).then((data) => {
        setCampaigns(data || []);
      });
    } else {
      setCampaigns([]);
    }
  }, [store?.id, store?.isMenuTesting]);

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
    <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:top-20 z-40 md:w-96 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[72vh] md:max-h-[calc(100vh-120px)] transition-all animate-in slide-in-from-bottom">
      
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
      <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>매장 영업시간: <strong>{store.breakTimeHours}</strong></span>
        </div>
        <div className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
          store.breakTimeActive
            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {store.breakTimeActive ? '☕ 지금 1:1 물물교환 가능!' : '영업 중'}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        
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

        {/* Registered Exchange Items Section */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-orange-500" />
            등록된 1:1 물물교환 품목 ({store.exchangeItems.length}개)
          </h3>
          <span className="text-xs text-gray-500">1:1 물물교환</span>
        </div>

        {store.exchangeItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            아직 등록된 교환 품목이 없습니다.
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
