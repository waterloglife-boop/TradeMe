import React from 'react';
import { RefreshCw, Plus, Store, Clock, Utensils, Bed, Filter, CheckCircle2 } from 'lucide-react';
import { StoreCategory } from '../types/trade';

interface NavbarProps {
  myBreakTimeActive: boolean;
  onToggleBreakTime: () => void;
  onOpenRegisterModal: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onlyBreakTime: boolean;
  onToggleOnlyBreakTime: () => void;
  storeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  myBreakTimeActive,
  onToggleBreakTime,
  onOpenRegisterModal,
  selectedCategory,
  onSelectCategory,
  onlyBreakTime,
  onToggleOnlyBreakTime,
  storeCount,
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
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                  사장님 1:1 바꿔먹기
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                요식업 & 소상공인 등가교환 벼룩시장
              </p>
            </div>
          </div>

          {/* Right Action Controls: Break Time Toggle & Register Button */}
          <div className="flex items-center gap-3">
            
            {/* Break Time Toggle Box */}
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all ${
              myBreakTimeActive
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${myBreakTimeActive ? 'bg-amber-500 animate-ping' : 'bg-gray-400'}`}></span>
                <Clock className={`w-4 h-4 ${myBreakTimeActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="text-xs sm:text-sm font-semibold hidden md:inline">
                  내 가게 브레이크 타임:
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
                {myBreakTimeActive ? '교환 가능 ON' : 'OFF'}
              </span>
            </div>

            {/* Item Registration Button */}
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">내 교환 메뉴 등록</span>
              <span className="sm:hidden">등록</span>
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
              요식업 (한식/일식/양식)
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
              숙박 및 서비스
            </button>
          </div>

          {/* Quick Filter: Show Breaktime Only */}
          <button
            onClick={onToggleOnlyBreakTime}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              onlyBreakTime
                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            ☕ 브레이크 타임 교환가능만 보기
          </button>
        </div>
      </div>
    </header>
  );
};
