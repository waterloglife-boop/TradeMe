import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Plus, Store, Clock, Utensils, Bed, ShoppingBag, Sparkles, User, LogIn, Edit3, List, Bell, BellOff, ChevronDown, ExternalLink } from 'lucide-react';
import { KAKAO_OPEN_CHAT_URL } from '../types/trade';

interface NavbarProps {
  myBreakTimeActive: boolean;
  onToggleBreakTime: () => void;
  onOpenAuthModal: () => void;
  isLoggedIn: boolean;
  userOwnerName: string;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onlyBreakTime: boolean;
  onToggleOnlyBreakTime: () => void;
  onlyMenuTesting?: boolean;
  onToggleOnlyMenuTesting?: () => void;
  menuTestingStoreCount?: number;
  exchangeReadyStoreCount?: number;
  storeCount: number;
  hasRegisteredStore?: boolean;
  pendingAlertCount?: number;
  onOpenCommunityModal?: () => void;
  onOpenChatListModal?: () => void;
  chatCount?: number;
  unreadChatCount?: number;
  onOpenRegisterModal?: () => void;
  onOpenTradeDashboard?: () => void;
  onOpenMenuTestDashboard?: () => void;
  onOpenCouponWallet?: () => void;
  voucherCount?: number;
  onOpenStoreListModal?: () => void;
  onOpenPoomasiModal?: () => void;
  onOpenReviewExtensionModal?: () => void;
  alarmEnabled?: boolean;
  onToggleAlarm?: () => void;
  isRefreshing?: boolean;
  onRefreshAll?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  myBreakTimeActive,
  onToggleBreakTime,
  onOpenAuthModal,
  isLoggedIn,
  userOwnerName,
  selectedCategory,
  onSelectCategory,
  onlyBreakTime,
  onToggleOnlyBreakTime,
  onlyMenuTesting = false,
  onToggleOnlyMenuTesting,
  menuTestingStoreCount = 0,
  exchangeReadyStoreCount = 0,
  storeCount,
  hasRegisteredStore = false,
  pendingAlertCount = 0,
  onOpenCommunityModal,
  onOpenChatListModal,
  chatCount = 0,
  unreadChatCount = 0,
  onOpenCouponWallet,
  voucherCount = 0,
  onOpenStoreListModal,
  onOpenPoomasiModal,
  onOpenReviewExtensionModal,
  alarmEnabled = true,
  onToggleAlarm,
  isRefreshing = false,
}) => {
  // 🌟 사장님 혜택 & 소통 통합 드롭다운 메뉴 State
  const [isBenefitsMenuOpen, setIsBenefitsMenuOpen] = useState(false);
  const benefitsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (benefitsMenuRef.current && !benefitsMenuRef.current.contains(event.target as Node)) {
        setIsBenefitsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm pt-safe"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
    >
      {/* Top Main Bar */}
      <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md shadow-orange-500/20 flex-shrink-0 overflow-hidden border border-orange-200 bg-white transition-transform hover:scale-105">
              <img src="/favicon.svg" alt="Trade Me 로고" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Trade Me
                </span>
                <span className="hidden xl:inline-block px-2 py-0.5 text-[11px] font-bold bg-orange-100 text-orange-800 rounded-full border border-orange-200 whitespace-nowrap">
                  소상공인 1:1 물물교환
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden 2xl:block truncate max-w-[260px]">
                식사 · 베이커리 · 편의점 신선식품 · 숙박 1:1 맞교환
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: 혜택·소통 모아보기, BreakTime, Refresh, Alarm (md:hidden) */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:hidden flex-shrink-0">
            {/* 🔄 모바일 새로고침 버튼 */}
            {onRefreshAll && (
              <button
                type="button"
                onClick={onRefreshAll}
                disabled={isRefreshing}
                title="데이터 새로고침"
                className="p-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hover:text-orange-600 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            )}

            {/* 🔔 모바일 알람 ON/OFF 버튼 */}
            {onToggleAlarm && (
              <button
                type="button"
                onClick={onToggleAlarm}
                title={alarmEnabled ? "실시간 알람 켜짐 (터치 시 끄기)" : "실시간 알람 켜기"}
                className={`p-1.5 rounded-full border cursor-pointer select-none transition-all active:scale-95 ${
                  alarmEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                    : 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                }`}
              >
                {alarmEnabled ? (
                  <Bell className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-amber-600" />
                )}
              </button>
            )}

            {/* ✨ 모바일 사장님 혜택 & 소통 메뉴 열기 */}
            <button
              type="button"
              onClick={() => setIsBenefitsMenuOpen(!isBenefitsMenuOpen)}
              className="flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 text-white text-[10px] font-black shadow-2xs active:scale-95 transition whitespace-nowrap cursor-pointer"
              title="사장님 혜택 & 커뮤니티 모아보기"
            >
              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
              <span>혜택·소통</span>
            </button>

            {/* 교환 ON / OFF */}
            <button
              type="button"
              onClick={onToggleBreakTime}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all active:scale-95 ${
                myBreakTimeActive
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${myBreakTimeActive ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-[10px] font-black">
                {myBreakTimeActive ? '교환 ON' : '교환 OFF'}
              </span>
            </button>
          </div>

          {/* Desktop Right Action Controls (hidden md:flex) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
            
            {/* 🌟 사장님 혜택 & 소통 통합 드롭다운 (단톡방+품앗이+AI리뷰+사랑방) */}
            <div className="relative" ref={benefitsMenuRef}>
              <button
                type="button"
                onClick={() => setIsBenefitsMenuOpen(!isBenefitsMenuOpen)}
                className="flex items-center gap-1 px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="사장님 혜택 및 커뮤니티 모아보기"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>사장님 혜택·소통</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBenefitsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBenefitsMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  <div className="px-3.5 py-2 text-[11px] font-extrabold text-gray-500 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <span>✨ 사장님 전용 혜택 & 소통</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700">TradeMe Plus</span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* 1. AI 리뷰 답글기 */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBenefitsMenuOpen(false);
                        onOpenReviewExtensionModal?.();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-3 transition group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        🤖
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 group-hover:text-purple-700">AI 리뷰 답글기</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-100 text-purple-700">무료 배포</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">배민·네이버 리뷰 3초 자동 생성 (크롬 확장)</p>
                      </div>
                    </button>

                    {/* 2. 네이버 플레이스 품앗이 */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBenefitsMenuOpen(false);
                        onOpenPoomasiModal?.();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-3 transition group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        ⭐
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 group-hover:text-emerald-700">플레이스 품앗이</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700">순위 UP</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">사장님끼리 네이버 저장 맞품앗이</p>
                      </div>
                    </button>

                    {/* 3. 사장님 사랑방 커뮤니티 */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBenefitsMenuOpen(false);
                        onOpenCommunityModal?.();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50 flex items-center gap-3 transition group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        ☕
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 group-hover:text-amber-700">사장님 사랑방</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">골목 사장님들의 자유로운 이야기 & 정보 공유</p>
                      </div>
                    </button>

                    {/* 4. 카카오톡 단톡방 */}
                    <a
                      href={KAKAO_OPEN_CHAT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsBenefitsMenuOpen(false)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-yellow-50 flex items-center gap-3 transition group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-400 text-yellow-950 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        💬
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 group-hover:text-yellow-900">공식 카카오톡 단톡방</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">사장님들과의 실시간 소통 & Q&A (새 창)</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 💬 1:1 사장님 대화함 버튼 */}
            {onOpenChatListModal && (
              <button
                type="button"
                onClick={onOpenChatListModal}
                className="relative flex items-center gap-1 px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="1:1 사장님 대화함"
              >
                <span className="text-xs sm:text-sm">💬</span>
                <span className="hidden xl:inline">1:1 대화함</span>
                <span className="xl:hidden">대화함</span>
                {chatCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/25 text-white">
                    {chatCount}
                  </span>
                )}
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* 🎟️ 내 교환권 보관함 버튼 */}
            {onOpenCouponWallet && (
              <button
                onClick={onOpenCouponWallet}
                className="flex items-center gap-1 px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="내 교환권 보관함"
              >
                <span className="text-xs sm:text-sm">🎟️</span>
                <span className="hidden xl:inline">교환권 보관함</span>
                <span className="xl:hidden">보관함</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  voucherCount >= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/25 text-white'
                }`}>
                  {voucherCount}/5
                </span>
              </button>
            )}

            {/* Break Time Toggle Box */}
            <div className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all ${
              myBreakTimeActive
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${myBreakTimeActive ? 'bg-amber-500 animate-ping' : 'bg-gray-400'}`}></span>
                <Clock className={`w-3.5 h-3.5 ${myBreakTimeActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="text-xs font-bold hidden 2xl:inline">
                  교환:
                </span>
              </div>
              <button
                onClick={onToggleBreakTime}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  myBreakTimeActive ? 'bg-amber-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={myBreakTimeActive}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    myBreakTimeActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[10px] sm:text-xs font-black ${myBreakTimeActive ? 'text-amber-700' : 'text-gray-500'}`}>
                {myBreakTimeActive ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 🔄 데스크톱 새로고침 버튼 (미니 아이콘형) */}
            {onRefreshAll && (
              <button
                type="button"
                onClick={onRefreshAll}
                disabled={isRefreshing}
                title="최신 매장 및 거래 데이터 새로고침"
                className="p-1.5 lg:p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : 'text-gray-600'}`} />
              </button>
            )}

            {/* 🔔 데스크톱 알람 ON/OFF 버튼 (미니 아이콘형) */}
            {onToggleAlarm && (
              <button
                type="button"
                onClick={onToggleAlarm}
                title={alarmEnabled ? "실시간 거래 및 대화 알람 켜짐 (클릭 시 끄기)" : "실시간 알람 켜기"}
                className={`p-1.5 lg:p-2 rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer ${
                  alarmEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                }`}
              >
                {alarmEnabled ? (
                  <Bell className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-amber-600" />
                )}
              </button>
            )}

            {/* 🏬 Store Management / Auth Button with Global Notification Badge */}
            <button
              onClick={onOpenAuthModal}
              className={`relative flex items-center gap-1 px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-extrabold rounded-xl transition-all shadow-xs active:scale-95 whitespace-nowrap ${
                isLoggedIn
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {isLoggedIn ? (
                <>
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                  <span className="hidden 2xl:inline">🏬 내 매장 관리 ({userOwnerName})</span>
                  <span className="hidden xl:inline 2xl:hidden">🏬 내 매장 ({userOwnerName})</span>
                  <span className="xl:hidden">내 매장</span>

                  {/* 🔴 Global Pending Alert Badge */}
                  {pendingAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[17px] sm:min-w-[20px] h-[17px] sm:h-[20px] px-1 bg-red-600 text-white font-black text-[9px] sm:text-[10px] rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                      {pendingAlertCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  <span>로그인</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar (Smooth Horizontal Scroll on Mobile & Desktop) */}
        <div className="py-2 border-t border-gray-100 overflow-x-auto no-scrollbar scroll-touch">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-max px-0.5">
            <button
              onClick={() => onSelectCategory('ALL')}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 사장님 ({storeCount})
            </button>

            <button
              onClick={() => onSelectCategory('FOOD')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'FOOD'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>요식업</span>
            </button>

            <button
              onClick={() => onSelectCategory('RETAIL')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'RETAIL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>유통 & 신선</span>
            </button>

            <button
              onClick={() => onSelectCategory('BEAUTY')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'BEAUTY'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>뷰티 & 케어</span>
            </button>

            <button
              onClick={() => onSelectCategory('ACCOMMODATION')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'ACCOMMODATION'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>숙박 & 레저</span>
            </button>

            <button
              onClick={() => onSelectCategory('SERVICE')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'SERVICE'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-blue-500" />
              <span>생활 & 서비스</span>
            </button>

            <div className="h-4 w-px bg-gray-200 flex-shrink-0 mx-1" />

            {/* Quick Filters */}
            {onToggleOnlyMenuTesting && (
              <button
                onClick={onToggleOnlyMenuTesting}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-sm ${
                  onlyMenuTesting
                    ? 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-purple-200'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
                title="체험단(시식단) 모집 매장만 지도에 표시"
              >
                <span>🧪</span>
                <span>체험단 모집</span>
                {menuTestingStoreCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    onlyMenuTesting ? 'bg-white text-purple-700' : 'bg-purple-600 text-white'
                  }`}>
                    {menuTestingStoreCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onToggleOnlyBreakTime}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                onlyBreakTime
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>☕ 물물교환 가능</span>
              {exchangeReadyStoreCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  onlyBreakTime ? 'bg-white text-amber-800' : 'bg-amber-600 text-white'
                }`}>
                  {exchangeReadyStoreCount}
                </span>
              )}
            </button>

            {/* 📋 목록으로 모아보기 버튼 */}
            {onOpenStoreListModal && (
              <button
                type="button"
                onClick={onOpenStoreListModal}
                className="flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-gray-900 text-white hover:bg-black transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <List className="w-3.5 h-3.5 text-amber-400" />
                <span>목록 모아보기</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
