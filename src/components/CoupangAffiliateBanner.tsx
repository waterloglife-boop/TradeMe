import React, { useEffect, useState } from 'react';
import { ExternalLink, X, Sparkles, ChevronRight, ShoppingBag } from 'lucide-react';
import { AdBannerKey } from '../types/trade';
import { fetchAdBannerStats, recordBannerImpression, recordBannerClick } from '../lib/supabase';

// 🚀 쿠팡 파트너스 로켓프레시 신선식품 새벽배송 공식 배너 정보
export const COUPANG_ROCKET_FRESH_URL = 'https://link.coupang.com/a/g30rXXHchE';
export const COUPANG_ROCKET_FRESH_IMAGE =
  'https://ads-partners.coupang.com/banners/1029753?trackingCode=AF9213595&subId=&traceId=V0-301-371ae01f4226dec2-I1029753&w=728&h=90';
export const COUPANG_FTC_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

interface TopMainSlimBannerProps {
  onExploreProducts?: () => void;
}

export const TopMainSlimBanner: React.FC<TopMainSlimBannerProps> = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [bannerUrl, setBannerUrl] = useState(COUPANG_ROCKET_FRESH_URL);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const stats = fetchAdBannerStats();
    const found = stats.find((s) => s.key === 'TOP_MAIN');
    if (found?.coupangUrl) {
      setBannerUrl(found.coupangUrl);
    }
    recordBannerImpression('TOP_MAIN');
  }, []);

  if (!isVisible) return null;

  const handleClick = () => {
    recordBannerClick('TOP_MAIN');
  };

  return (
    <div className="w-full bg-white/95 border-b border-gray-200/90 shadow-2xs relative z-10 font-sans backdrop-blur-xs py-1 sm:py-1.5 px-3">
      <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center">
        
        {/* 쿠팡 파트너스 728x90 공식 그래픽 배너 (로켓프레시 신선식품 새벽배송) */}
        {!imageError ? (
          <a
            href={bannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="unsafe-url"
            onClick={handleClick}
            className="block max-w-full transition-transform active:scale-[0.99] group cursor-pointer"
            title="쿠팡 로켓프레시 신선식품 새벽배송 바로가기"
          >
            <img
              src={COUPANG_ROCKET_FRESH_IMAGE}
              alt="쿠팡 로켓프레시 신선식품 새벽배송"
              width={728}
              height={90}
              className="w-full max-w-[728px] h-auto max-h-[56px] sm:max-h-[72px] md:max-h-[88px] object-contain rounded-lg shadow-2xs group-hover:opacity-95 transition-opacity"
              onError={() => setImageError(true)}
              loading="eager"
            />
          </a>
        ) : (
          /* 애드블록 등으로 배너 이미지 로드 불가 시 폴백 텍스트 배너 */
          <a
            href={bannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="unsafe-url"
            onClick={handleClick}
            className="w-full max-w-[728px] flex items-center justify-between gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-xl shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-black tracking-wider flex items-center gap-1 flex-shrink-0">
                🚀 로켓프레시
              </span>
              <span className="font-extrabold truncate text-white text-xs sm:text-sm">
                [새벽배송] 신선식품 · 과일 · 식자재 산지직송 최저가전
              </span>
            </div>
            <span className="text-[11px] text-white font-bold flex items-center flex-shrink-0 bg-black/20 px-2 py-1 rounded-lg">
              바로가기 <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </a>
        )}

        {/* ⚖️ 공정거래위원회 필수 표기 문구 */}
        <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium text-center mt-1 select-none flex items-center justify-center gap-1">
          <span>※</span>
          <span>{COUPANG_FTC_DISCLOSURE}</span>
        </div>

        {/* 배너 닫기 버튼 */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="absolute -top-0.5 right-0 sm:right-2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          title="배너 닫기"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

      </div>
    </div>
  );
};

// 🛍️ 사장님 사랑방(커뮤니티) 피드 중간에 들어가는 네이티브 스폰서 카드
export const CommunitySponsoredCard: React.FC = () => {
  const [bannerUrl, setBannerUrl] = useState('https://link.coupang.com/a/b02_packaging_box');

  useEffect(() => {
    const stats = fetchAdBannerStats();
    const found = stats.find((s) => s.key === 'COMMUNITY_FEED');
    if (found?.coupangUrl) {
      setBannerUrl(found.coupangUrl);
    }
    recordBannerImpression('COMMUNITY_FEED');
  }, []);

  const handleClick = () => {
    recordBannerClick('COMMUNITY_FEED');
    window.open(bannerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="p-4 rounded-3xl bg-gradient-to-br from-orange-50/90 via-amber-50/70 to-orange-100/60 border border-orange-300/80 shadow-xs cursor-pointer hover:shadow-md hover:border-orange-400 transition-all space-y-2.5 animate-in fade-in"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center gap-1 shadow-xs">
            <ShoppingBag className="w-3 h-3" />
            <span>사장님 제휴 특가</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium">쿠팡 비즈 소상공인 파트너</span>
        </div>
        <span className="text-[11px] text-orange-700 font-extrabold flex items-center gap-0.5">
          할인 보러가기 <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-gray-950">
          📦 [배달·포장 필수품] 원형 탕용기 / 실링용기 500세트 30% 초특가 모음전
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          배달 매장 사장님들을 위한 필수 포장 부자재 최저가! 로켓와우 오늘 주문 시 내일 오전 도착 보장.
        </p>
      </div>

      <div className="pt-1 border-t border-orange-200/60 flex items-center justify-between text-[10px] text-gray-400">
        <span>⭐ 쿠팡 로켓배송 실시간 가격비교</span>
        <span>* {COUPANG_FTC_DISCLOSURE}</span>
      </div>
    </div>
  );
};
