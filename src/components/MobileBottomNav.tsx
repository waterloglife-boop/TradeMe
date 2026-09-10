import React from 'react';
import { MapPin, MessageSquare, Coffee, Ticket, Store, LogIn } from 'lucide-react';

export type MobileTab = 'MAP' | 'CHAT' | 'COMMUNITY' | 'WALLET' | 'MY_STORE';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  isLoggedIn: boolean;
  userOwnerName?: string;
  voucherCount?: number;
  chatCount?: number;
  unreadChatCount?: number;
  pendingAlertCount?: number;
  myBreakTimeActive?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  isLoggedIn,
  userOwnerName,
  voucherCount = 0,
  chatCount = 0,
  unreadChatCount = 0,
  pendingAlertCount = 0,
  myBreakTimeActive = false,
}) => {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-2xl pb-safe md:hidden select-none"
    >
      <div className="flex items-center justify-around h-15 px-1 max-w-md mx-auto">
        
        {/* 1. 🗺️ 지도 탐색 (홈) */}
        <button
          type="button"
          onClick={() => onSelectTab('MAP')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
            activeTab === 'MAP' ? 'text-orange-600 font-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <MapPin
              className={`w-5 h-5 transition-transform ${
                activeTab === 'MAP' ? 'scale-110 text-orange-600' : 'text-gray-500'
              }`}
            />
            {activeTab === 'MAP' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">지도 탐색</span>
        </button>

        {/* 2. 💬 1:1 대화함 */}
        <button
          type="button"
          onClick={() => onSelectTab('CHAT')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative ${
            activeTab === 'CHAT' ? 'text-orange-600 font-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <MessageSquare
              className={`w-5 h-5 transition-transform ${
                activeTab === 'CHAT' ? 'scale-110 text-orange-600' : 'text-gray-500'
              }`}
            />
            {unreadChatCount > 0 ? (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-md animate-bounce border-2 border-white">
                {unreadChatCount}
              </span>
            ) : chatCount > 0 ? (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-gray-200 text-gray-700 font-bold text-[8px]">
                {chatCount}
              </span>
            ) : null}
            {activeTab === 'CHAT' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">1:1 대화</span>
        </button>

        {/* 3. ☕ 사장님 사랑방 */}
        <button
          type="button"
          onClick={() => onSelectTab('COMMUNITY')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
            activeTab === 'COMMUNITY' ? 'text-orange-600 font-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <Coffee
              className={`w-5 h-5 transition-transform ${
                activeTab === 'COMMUNITY' ? 'scale-110 text-orange-600' : 'text-gray-500'
              }`}
            />
            {activeTab === 'COMMUNITY' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">사랑방</span>
        </button>

        {/* 4. 🎟️ 교환권 보관함 */}
        <button
          type="button"
          onClick={() => onSelectTab('WALLET')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative ${
            activeTab === 'WALLET' ? 'text-orange-600 font-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <Ticket
              className={`w-5 h-5 transition-transform ${
                activeTab === 'WALLET' ? 'scale-110 text-orange-600' : 'text-gray-500'
              }`}
            />
            <span
              className={`absolute -top-1 -right-3 px-1 py-0.2 rounded-full font-black text-[8px] ${
                voucherCount >= 5
                  ? 'bg-red-500 text-white animate-pulse'
                  : voucherCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {voucherCount}/5
            </span>
            {activeTab === 'WALLET' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">보관함</span>
        </button>

        {/* 5. 🏬 내 매장 / 로그인 */}
        <button
          type="button"
          onClick={() => onSelectTab('MY_STORE')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative ${
            activeTab === 'MY_STORE' ? 'text-orange-600 font-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            {isLoggedIn ? (
              <>
                <Store
                  className={`w-5 h-5 transition-transform ${
                    activeTab === 'MY_STORE' ? 'scale-110 text-orange-600' : 'text-gray-500'
                  }`}
                />
                {myBreakTimeActive && (
                  <span
                    title="교환 가능 가동 중"
                    className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300 animate-pulse"
                  />
                )}
                {pendingAlertCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 bg-red-600 text-white font-black text-[8px] rounded-full flex items-center justify-center shadow border border-white">
                    {pendingAlertCount}
                  </span>
                )}
              </>
            ) : (
              <LogIn
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'MY_STORE' ? 'scale-110 text-orange-600' : 'text-gray-500'
                }`}
              />
            )}
            {activeTab === 'MY_STORE' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">
            {isLoggedIn ? (userOwnerName ? `${userOwnerName}` : '내 매장') : '로그인'}
          </span>
        </button>

      </div>
    </nav>
  );
};
