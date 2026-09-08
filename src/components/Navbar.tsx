import React from 'react';
import { RefreshCw, Plus, Store, Clock, Utensils, Bed, ShoppingBag, Sparkles, User, LogIn, Edit3 } from 'lucide-react';

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
  storeCount: number;
  hasRegisteredStore?: boolean;
  pendingAlertCount?: number;
  onOpenCommunityModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenTradeDashboard?: () => void;
  onOpenMenuTestDashboard?: () => void;
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
  storeCount,
  hasRegisteredStore = false,
  pendingAlertCount = 0,
  onOpenCommunityModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Trade Me
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                  소상공인 1:1 물물교환
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                식사 · 베이커리 · 편의점 신선식품 · 숙박 1:1 자원 맞교환
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* ☕ 사장님 사랑방 커뮤니티 버튼 */}
            {onOpenCommunityModal && (
              <button
                onClick={onOpenCommunityModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 active:scale-95 transition whitespace-nowrap"
              >
                <span className="text-sm">☕</span>
                <span className="hidden sm:inline">사장님 사랑방</span>
                <span className="sm:hidden">사랑방</span>
              </button>
            )}

            {/* Break Time Toggle Box */}
            <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border transition-all ${
              myBreakTimeActive
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${myBreakTimeActive ? 'bg-amber-500 animate-ping' : 'bg-gray-400'}`}></span>
                <Clock className={`w-4 h-4 ${myBreakTimeActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="text-xs sm:text-sm font-semibold hidden md:inline">
                  내 가게 교환가능:
                </span>
              </div>
              <button
                onClick={onToggleBreakTime}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  myBreakTimeActive ? 'bg-amber-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={myBreakTimeActive}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    myBreakTimeActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${myBreakTimeActive ? 'text-amber-700' : 'text-gray-500'}`}>
                {myBreakTimeActive ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 🏬 Store Management / Auth Button with Global Notification Badge */}
            <button
              onClick={onOpenAuthModal}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap ${
                isLoggedIn
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {isLoggedIn ? (
                <>
                  <Store className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="hidden sm:inline">🏬 내 매장 관리 ({userOwnerName})</span>
                  <span className="sm:hidden">🏬 내 매장</span>

                  {/* 🔴 Global Pending Alert Badge */}
                  {pendingAlertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                      {pendingAlertCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-gray-600" />
                  <span>로그인/가입</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <button
              onClick={() => onSelectCategory('ALL')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 사장님 ({storeCount})
            </button>

            <button
              onClick={() => onSelectCategory('FOOD')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'FOOD'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              요식업
            </button>

            <button
              onClick={() => onSelectCategory('RETAIL')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'RETAIL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              유통 & 신선
            </button>

            <button
              onClick={() => onSelectCategory('BEAUTY')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'BEAUTY'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              뷰티 & 케어
            </button>

            <button
              onClick={() => onSelectCategory('ACCOMMODATION')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'ACCOMMODATION'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              숙박 & 레저
            </button>

            <button
              onClick={() => onSelectCategory('SERVICE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === 'SERVICE'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-blue-500" />
              생활 & 서비스
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {/* 🧪 Menu Test Filter */}
            {onToggleOnlyMenuTesting && (
              <button
                onClick={onToggleOnlyMenuTesting}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap shadow-sm ${
                  onlyMenuTesting
                    ? 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-purple-200'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span>🧪</span>
                <span>신메뉴 테스트 모집중</span>
                {menuTestingStoreCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    onlyMenuTesting ? 'bg-white text-purple-700' : 'bg-purple-600 text-white'
                  }`}>
                    {menuTestingStoreCount}
                  </span>
                )}
              </button>
            )}

            {/* ☕ Break Time Filter */}
            <button
              onClick={onToggleOnlyBreakTime}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                onlyBreakTime
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              ☕ 물물교환 가능만 보기
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
