import React, { useEffect, useState } from 'react';
import { ExternalLink, X, Sparkles, ChevronRight, ShoppingBag } from 'lucide-react';
import { AdBannerKey } from '../types/trade';
import { fetchAdBannerStats, recordBannerImpression, recordBannerClick } from '../lib/supabase';

interface TopMainSlimBannerProps {
  onExploreProducts?: () => void;
}

export const TopMainSlimBanner: React.FC<TopMainSlimBannerProps> = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('https://link.coupang.com/a/b01_food_wholesale');

  useEffect(() => {
    const stats = fetchAdBannerStats();
    const found = stats.find((s) => s.key === 'TOP_MAIN');
    if (found?.coupangUrl) {
      setBannerUrl(found.coupangUrl);
    }
    recordBannerImpression('TOP_MAIN');
  }, []);

  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    recordBannerClick('TOP_MAIN');
    // Open affiliate link in new window safely
    window.open(bannerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white shadow-xs relative z-10 font-sans border-b border-orange-600/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs">
        
        {/* Clickable Banner Body */}
        <div
          onClick={handleClick}
          className="flex-1 flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity truncate"
        >
          <span className="px-2 py-0.5 rounded-full bg-black/25 text-amber-200 text-[10px] font-black tracking-wider flex items-center gap-1 flex-shrink-0">
            <span>🔥 식자재 특가</span>
          </span>
          <span className="font-extrabold truncate text-white text-[11px] sm:text-xs">
            [소상공인 원가절감] 업소용 콩기름 18L · 쌀 20kg · 대용량 양념 쿠팡 로켓배송 최저가전
          </span>
          <span className="hidden sm:inline text-[10px] text-orange-100 font-bold underline flex-shrink-0 flex items-center">
            보러가기 <ChevronRight className="w-3 h-3 ml-0.5" />
          </span>
          <span className="hidden lg:inline text-[9px] text-orange-200/80 font-normal pl-2 border-l border-white/20">
            * 이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-black/20 rounded-md text-white/80 hover:text-white transition-colors flex-shrink-0"
          title="배너 닫기"
        >
          <X className="w-3.5 h-3.5" />
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
        <span>* 이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다</span>
      </div>
    </div>
  );
};
