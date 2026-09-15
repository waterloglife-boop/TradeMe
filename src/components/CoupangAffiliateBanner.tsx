import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ShoppingBag, Gift, Sparkles, Clock } from 'lucide-react';
import { AdBannerKey } from '../types/trade';
import { fetchAdBannerStats, recordBannerImpression, recordBannerClick } from '../lib/supabase';

// ⚖️ 공정거래위원회 필수 표기 공식 문구
export const COUPANG_FTC_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

// 🚀 4대 쿠팡 파트너스 공식 배너 & 제휴 링크 데이터
export const COUPANG_BANNERS = {
  TOP_MAIN_FRESH: {
    key: 'TOP_MAIN' as AdBannerKey,
    id: 'top-fresh',
    title: '쿠팡 로켓프레시 신선식품 새벽배송 바로가기',
    url: 'https://link.coupang.com/a/g30rXXHchE',
    image:
      'https://ads-partners.coupang.com/banners/1029753?trackingCode=AF9213595&subId=&traceId=V0-301-371ae01f4226dec2-I1029753&w=728&h=90',
    tag: '🚀 로켓프레시',
    fallbackTitle: '[새벽배송] 신선식품 · 과일 · 식자재 산지직송 최저가전',
    fallbackBg: 'from-emerald-600 via-teal-600 to-emerald-700',
  },
  TOP_MAIN_WOW: {
    key: 'WALLET_FOOTER' as AdBannerKey,
    id: 'top-wow',
    title: '쿠팡 로켓와우 회원전용 매일 오전 7시 OPEN 바로가기',
    url: 'https://link.coupang.com/a/g30QoZWHu0',
    image:
      'https://ads-partners.coupang.com/banners/1029755?trackingCode=AF9213595&subId=&traceId=V0-301-969b06e95b87326d-I1029755&w=728&h=90',
    tag: '⏰ 와우 골든아워',
    fallbackTitle: '[로켓와우 전용] 매일 오전 7시 한정수량 골든아워 타임특가 OPEN',
    fallbackBg: 'from-amber-500 via-orange-500 to-amber-600',
  },
  COMMUNITY_CHUSEOK: {
    key: 'COMMUNITY_FEED' as AdBannerKey,
    id: 'comm-chuseok',
    title: '쿠팡 한가위 추석 페스타 최대 50% 할인 대전 바로가기',
    url: 'https://link.coupang.com/a/g312wbXxOS',
    image: '/banners/chuseok-festa.png',
    period: '~ 2026. 09. 27',
    headline: '🌕 [추석 페스타] 한가위 선물세트 & 명절 제수용품 ~50% 할인 대전',
    desc: '소상공인 거래처·가족을 위한 알뜰 한가위 선물세트 로켓배송! 한정수량 사전예약 특가',
  },
  STORE_HANGAWI: {
    key: 'STORE_DRAWER' as AdBannerKey,
    id: 'store-hangawi',
    title: '쿠팡 와우회원 전용 2026 생활용품 한가위 선물대전 바로가기',
    url: 'https://link.coupang.com/a/g32fzuTLVs',
    image: '/banners/hangawi-gift.png',
    period: '~ 2026. 09. 25',
    headline: '🧴 [와우회원 특가] 2026 생활용품 한가위 선물대전',
    desc: '샴푸·바디케어·위생용품 명절 실속 선물세트 로켓배송 최저가전',
  },
};

// =========================================================================
// 1. 🏆 홈 상단 기획전 배너 (로켓프레시 & 로켓와우 순환 728x90)
// =========================================================================
export const TopMainSlimBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<0 | 1>(0); // 0: 로켓프레시, 1: 로켓와우
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    recordBannerImpression('TOP_MAIN');
    // 8초마다 로켓프레시 <-> 로켓와우 자동 순환
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const currentBanner = activeTab === 0 ? COUPANG_BANNERS.TOP_MAIN_FRESH : COUPANG_BANNERS.TOP_MAIN_WOW;
  const hasImageError = imageErrorMap[currentBanner.id];

  const handleBannerClick = () => {
    recordBannerClick('TOP_MAIN');
  };

  return (
    <div className="w-full bg-white/95 border-b border-gray-200/90 shadow-2xs relative z-10 font-sans backdrop-blur-xs py-1 sm:py-1.5 px-3">
      <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center">
        
        {/* 배너 탭 인디케이터 (작고 깔끔한 전환 닷) */}
        <div className="flex items-center gap-1.5 mb-1 select-none">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              activeTab === 0
                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            🚀 로켓프레시 새벽배송
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              activeTab === 1
                ? 'bg-amber-500 text-white shadow-2xs scale-105'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            ⏰ 와우 7시 타임특가
          </button>
        </div>

        {/* 🎯 클릭 가능한 메인 배너 카드 */}
        <div className="relative inline-block w-full max-w-[728px] group">
          <a
            href={currentBanner.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="unsafe-url"
            onClick={handleBannerClick}
            className="block w-full transition-transform active:scale-[0.99] cursor-pointer rounded-lg overflow-hidden relative"
            title={currentBanner.title}
          >
            {!hasImageError ? (
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                width={728}
                height={90}
                className="w-full h-auto max-h-[54px] sm:max-h-[70px] md:max-h-[86px] object-contain mx-auto rounded-lg shadow-2xs group-hover:opacity-95 transition-opacity"
                onError={() => setImageErrorMap((prev) => ({ ...prev, [currentBanner.id]: true }))}
                loading="eager"
              />
            ) : (
              <div
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r ${currentBanner.fallbackBg} text-white rounded-xl shadow-xs`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black tracking-wider flex items-center gap-1 flex-shrink-0">
                    {currentBanner.tag}
                  </span>
                  <span className="font-extrabold truncate text-white text-xs sm:text-sm">
                    {currentBanner.fallbackTitle}
                  </span>
                </div>
                <span className="text-[11px] text-white font-bold flex items-center flex-shrink-0 bg-black/20 px-2 py-1 rounded-lg">
                  바로가기 <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            )}

            {/* 🎯 [사용자 요청 꼼수 X 버튼]
                배너 그래픽 우측 상단 바로 안쪽에 정밀 배치!
                사용자가 X를 누르려다 살짝만 빗나가도 쿠팡 배너 링크가 클릭되도록 연출 */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer shadow-xs border border-white/25"
              title="배너 닫기"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 pointer-events-none" />
            </button>
          </a>
        </div>

        {/* ⚖️ 공정거래위원회 필수 표기 문구 */}
        <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium text-center mt-1 select-none flex items-center justify-center gap-1">
          <span>※</span>
          <span>{COUPANG_FTC_DISCLOSURE}</span>
        </div>

      </div>
    </div>
  );
};

// =========================================================================
// 2. 🛍️ 사장님 사랑방(커뮤니티) 피드 스폰서 카드 (추석 페스타 ~50% 할인)
// =========================================================================
export const CommunitySponsoredCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const banner = COUPANG_BANNERS.COMMUNITY_CHUSEOK;

  useEffect(() => {
    recordBannerImpression('COMMUNITY_FEED');
  }, []);

  if (!isVisible) return null;

  const handleClick = () => {
    recordBannerClick('COMMUNITY_FEED');
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-100/60 border border-amber-300/80 shadow-xs hover:shadow-md transition-all animate-in fade-in overflow-hidden">
      
      {/* 🎯 [사용자 요청 꼼수 X 버튼] 카드 우측 상단 안쪽에 배치 */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/25 hover:bg-black/60 text-gray-700 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-black/10"
        title="광고 닫기"
      >
        <X className="w-3.5 h-3.5 pointer-events-none" />
      </button>

      {/* 클릭 시 쿠팡 파트너스 이동 링크 */}
      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="unsafe-url"
        onClick={handleClick}
        className="block p-4 sm:p-5 space-y-3 cursor-pointer select-none"
      >
        {/* 상단 뱃지 */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-xs">
            <span>🌕</span>
            <span>추석 특별 할인</span>
          </span>
          <span className="text-[10px] text-amber-900/70 font-bold">{banner.period}</span>
          <span className="text-[11px] text-orange-700 font-extrabold flex items-center gap-0.5 ml-auto pr-6">
            특가 보러가기 <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 본문 (크롭된 공식 그래픽 썸네일 + 문구) */}
        <div className="flex items-center gap-3.5">
          <img
            src={banner.image}
            alt="쿠팡 추석 페스타"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-xs border border-amber-200/80 flex-shrink-0"
          />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight">
              {banner.headline}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {banner.desc}
            </p>
          </div>
        </div>

        {/* ⚖️ 공정거래위원회 필수 표기 문구 */}
        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-gray-400">
          <span>⭐ 쿠팡 로켓배송 실시간 가격비교</span>
          <span>* {COUPANG_FTC_DISCLOSURE}</span>
        </div>
      </a>
    </div>
  );
};

// =========================================================================
// 3. 🎁 매장 상세 서랍 하단 배너 (2026 생활용품 한가위 선물대전)
// =========================================================================
export const StoreDrawerSponsoredCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const banner = COUPANG_BANNERS.STORE_HANGAWI;

  useEffect(() => {
    recordBannerImpression('STORE_DRAWER');
  }, []);

  if (!isVisible) return null;

  const handleClick = () => {
    recordBannerClick('STORE_DRAWER');
  };

  return (
    <div className="relative mx-3 sm:mx-4 mb-3 rounded-2xl bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-blue-100/70 border border-blue-200 shadow-xs hover:shadow-md transition-all overflow-hidden">
      
      {/* 🎯 [사용자 요청 꼼수 X 버튼] */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/25 hover:bg-black/60 text-gray-600 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-black/10"
        title="광고 닫기"
      >
        <X className="w-3 h-3 pointer-events-none" />
      </button>

      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="unsafe-url"
        onClick={handleClick}
        className="block p-3 sm:p-3.5 space-y-2 cursor-pointer select-none"
      >
        <div className="flex items-center justify-between pr-5">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center gap-1 shadow-2xs">
              <Gift className="w-3 h-3" />
              <span>와우회원 한가위 특가</span>
            </span>
            <span className="text-[10px] text-blue-900/60 font-bold">{banner.period}</span>
          </div>
          <span className="text-[10px] text-blue-700 font-extrabold flex items-center">
            기획전 &gt;
          </span>
        </div>

        <div className="flex items-center gap-3">
          <img
            src={banner.image}
            alt="생활용품 한가위 선물대전"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-2xs border border-blue-200 flex-shrink-0"
          />
          <div className="space-y-0.5">
            <h5 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-snug">
              {banner.headline}
            </h5>
            <p className="text-[11px] text-gray-600 leading-normal line-clamp-1">
              {banner.desc}
            </p>
          </div>
        </div>

        {/* ⚖️ 공정위 문구 */}
        <div className="pt-1.5 border-t border-blue-200/50 flex items-center justify-between text-[9px] text-gray-400">
          <span>쿠팡 비즈 소상공인 파트너</span>
          <span>* {COUPANG_FTC_DISCLOSURE}</span>
        </div>
      </a>
    </div>
  );
};

// =========================================================================
// 4. 🎟️ 교환권 보관함 & 푸터 스폰서 배너 (로켓와우 골든아워 특가)
// =========================================================================
export const WalletFooterSponsoredCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const banner = COUPANG_BANNERS.TOP_MAIN_WOW;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    recordBannerImpression('WALLET_FOOTER');
  }, []);

  if (!isVisible) return null;

  const handleClick = () => {
    recordBannerClick('WALLET_FOOTER');
  };

  return (
    <div className="relative w-full rounded-2xl bg-amber-50/90 border border-amber-200/90 p-2 sm:p-2.5 space-y-1.5 shadow-xs overflow-hidden">
      
      {/* 🎯 [사용자 요청 꼼수 X 버튼] */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/30 hover:bg-black/65 text-white/80 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-white/20"
        title="광고 닫기"
      >
        <X className="w-3 h-3 pointer-events-none" />
      </button>

      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="unsafe-url"
        onClick={handleClick}
        className="block cursor-pointer"
        title={banner.title}
      >
        {!imageError ? (
          <img
            src={banner.image}
            alt={banner.title}
            width={728}
            height={90}
            className="w-full h-auto max-h-[52px] sm:max-h-[64px] object-contain rounded-xl shadow-2xs"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold">
            <span>⏰ [로켓와우] 매일 오전 7시 골든아워 특가 OPEN!</span>
            <span>바로가기 &gt;</span>
          </div>
        )}
      </a>

      {/* ⚖️ 공정거래위원회 문구 */}
      <div className="text-[9px] text-gray-500 font-medium text-center select-none">
        ※ {COUPANG_FTC_DISCLOSURE}
      </div>
    </div>
  );
};
