import React from 'react';
import { RefreshCw, Plus, Store, Clock, Utensils, Bed, ShoppingBag, Sparkles, User, LogIn, Edit3, List, Bell, BellOff } from 'lucide-react';

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
  alarmEnabled = true,
  onToggleAlarm,
  isRefreshing = false,
  onRefreshAll,
}) => {
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

          {/* Mobile Right Controls: Refresh, Alarm toggle, and BreakTime toggle (md:hidden) */}
          <div className="flex items-center gap-1.5 md:hidden flex-shrink-0">
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
                title={alarmEnabled ? "실시간 알람 소리 켜짐 (터치 시 끄기)" : "실시간 백그라운드 푸시 알람 켜기 (터치 시 설정 안내)"}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border cursor-pointer select-none transition-all active:scale-95 ${
                  alarmEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                    : 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                }`}
              >
                {alarmEnabled ? (
                  <>
                    <Bell className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-black">알람 ON</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 text-amber-600 animate-bounce" />
                    <span className="text-[10px] font-black">알람 켜기</span>
                  </>
                )}
              </button>
            )}

            {/* ⭐ 모바일 플레이스 품앗이 바로가기 */}
            {onOpenPoomasiModal && (
              <button
                type="button"
                onClick={onOpenPoomasiModal}
                className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shadow-2xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="네이버 플레이스 저장 품앗이"
              >
                <span>⭐</span>
                <span>품앗이</span>
              </button>
            )}

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
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 flex-shrink-0">
            
            {/* ⭐ 네이버 플레이스 저장 품앗이 버튼 */}
            {onOpenPoomasiModal && (
              <button
                type="button"
                onClick={onOpenPoomasiModal}
                className="flex items-center gap-1 px-2 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="네이버 플레이스 저장 품앗이"
              >
                <span className="text-xs sm:text-sm">⭐</span>
                <span className="hidden xl:inline">플레이스 품앗이</span>
                <span className="xl:hidden">품앗이</span>
              </button>
            )}

            {/* ☕ 사장님 사랑방 커뮤니티 버튼 */}
            {onOpenCommunityModal && (
              <button
                onClick={onOpenCommunityModal}
                className="flex items-center gap-1 px-2 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
                title="사장님 사랑방 커뮤니티"
              >
                <span className="text-xs sm:text-sm">☕</span>
                <span className="hidden xl:inline">사장님 사랑방</span>
                <span className="xl:hidden">사랑방</span>
              </button>
            )}

            {/* 💬 1:1 사장님 대화함 버튼 */}
            {onOpenChatListModal && (
              <button
                type="button"
                onClick={onOpenChatListModal}
                className="relative flex items-center gap-1 px-2 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
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
                className="flex items-center gap-1 px-2 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
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
            <div className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full border transition-all ${
              myBreakTimeActive
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${myBreakTimeActive ? 'bg-amber-500 animate-ping' : 'bg-gray-400'}`}></span>
                <Clock className={`w-3.5 h-3.5 ${myBreakTimeActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="text-xs font-semibold hidden 2xl:inline">
                  내 가게 교환가능:
                </span>
                <span className="text-xs font-semibold hidden md:inline 2xl:hidden">
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
              <span className={`text-[10px] sm:text-xs font-bold ${myBreakTimeActive ? 'text-amber-700' : 'text-gray-500'}`}>
                {myBreakTimeActive ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 🔄 데스크톱 새로고침 버튼 */}
            {onRefreshAll && (
              <button
                type="button"
                onClick={onRefreshAll}
                disabled={isRefreshing}
                title="최신 매장 및 거래 데이터 새로고침"
                className="flex items-center gap-1 px-2 lg:px-2.5 py-1 sm:py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : 'text-gray-500'}`} />
                <span className="hidden 2xl:inline">{isRefreshing ? '동기화 중...' : '새로고침'}</span>
              </button>
            )}

            {/* 🔔 데스크톱 알람 ON/OFF 버튼 */}
            {onToggleAlarm && (
              <button
                type="button"
                onClick={onToggleAlarm}
                title={alarmEnabled ? "실시간 거래 및 대화 알람 소리 켜짐 (클릭 시 끄기)" : "실시간 백그라운드 푸시 알람 켜기 (클릭 시 설정 안내)"}
                className={`flex items-center gap-1 px-2 lg:px-2.5 py-1 sm:py-1.5 text-xs font-bold rounded-xl transition shadow-2xs active:scale-95 border cursor-pointer ${
                  alarmEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                }`}
              >
                {alarmEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span className="hidden xl:inline">알람 ON</span>
                    <span className="xl:hidden font-black text-[10px]">ON</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                    <span className="hidden xl:inline">알람 켜기</span>
                    <span className="xl:hidden font-black text-[10px]">켜기</span>
                  </>
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
