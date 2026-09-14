import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  MapPin,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  ShieldCheck,
  Utensils,
  ShoppingBag,
  Sparkles,
  Bed,
  Store as StoreIcon,
  Map,
  Coffee,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { Store, ExchangeItem, MenuTestCampaign } from '../types/trade';

interface StoreListModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  myStore: Store;
  isLoggedIn: boolean;
  onSelectStoreOnMap: (store: Store) => void;
  onOpenProposal: (item: ExchangeItem) => void;
  onOpenChat: (targetStore: Store) => void;
  onOpenMenuTestApply: (store: Store, campaign?: MenuTestCampaign) => void;
}

// Haversine 거리 계산 헬퍼 (km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return -1;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 0 || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

function estimateWalkTime(km: number): string {
  if (km < 0 || isNaN(km)) return '';
  const mins = Math.round((km * 1000) / 75);
  if (mins <= 1) return '도보 1분';
  if (mins < 60) return `도보 ${mins}분`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `도보 ${hours}시간 ${remainMins}분`;
}

type StatusFilterType = 'ALL' | 'MENU_TEST' | 'EXCHANGE_READY';
type CategoryFilterType = 'ALL' | 'FOOD' | 'RETAIL' | 'BEAUTY' | 'OTHER';
type DistanceFilterType = 'ALL' | 1 | 3 | 5 | 10;
type SortType = 'DISTANCE' | 'TRADES' | 'NAME';

export const StoreListModal: React.FC<StoreListModalProps> = ({
  isOpen,
  onClose,
  stores,
  myStore,
  isLoggedIn,
  onSelectStoreOnMap,
  onOpenProposal,
  onOpenChat,
  onOpenMenuTestApply,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>('ALL');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortType>('DISTANCE');

  // 거리 계산된 매장 리스트 생성
  const storesWithDistance = useMemo(() => {
    const baseLat = myStore?.lat || 35.33;
    const baseLng = myStore?.lng || 129.02;

    return stores.map((s) => {
      const distKm =
        s.lat && s.lng ? calculateDistanceKm(baseLat, baseLng, s.lat, s.lng) : -1;
      return {
        ...s,
        distKm,
      };
    });
  }, [stores, myStore?.lat, myStore?.lng]);

  // 다중 조건 필터링 & 검색 적용
  const filteredStores = useMemo(() => {
    return storesWithDistance
      .filter((store) => {
        // 1. 상태 필터
        if (statusFilter === 'MENU_TEST' && !store.isMenuTesting) return false;
        if (statusFilter === 'EXCHANGE_READY') {
          const hasExchange =
            store.breakTimeActive ||
            store.voucherActive ||
            Boolean(store.exchangeItems && store.exchangeItems.length > 0);
          if (!hasExchange) return false;
        }

        // 2. 카테고리 필터
        if (categoryFilter !== 'ALL') {
          const c = store.category?.toUpperCase() || '';
          const cName = store.categoryName || '';

          if (categoryFilter === 'FOOD') {
            const isFood =
              ['FOOD', 'KOREAN', 'JAPANESE', 'WESTERN', 'CHINESE', 'SNACK', 'CAFE', 'PUB'].includes(c) ||
              cName.includes('외식') ||
              cName.includes('음식') ||
              cName.includes('식당') ||
              cName.includes('카페') ||
              cName.includes('주점');
            if (!isFood) return false;
          } else if (categoryFilter === 'RETAIL') {
            const isRetail =
              ['CONVENIENCE', 'BAKERY', 'FRESH_FOOD'].includes(c) ||
              cName.includes('유통') ||
              cName.includes('신선') ||
              cName.includes('마트') ||
              cName.includes('식자재') ||
              cName.includes('베이커리') ||
              cName.includes('편의점');
            if (!isRetail) return false;
          } else if (categoryFilter === 'BEAUTY') {
            const isBeauty =
              c === 'BEAUTY' ||
              cName.includes('뷰티') ||
              cName.includes('미용') ||
              cName.includes('헤어') ||
              cName.includes('네일') ||
              cName.includes('피부') ||
              cName.includes('케어');
            if (!isBeauty) return false;
          } else if (categoryFilter === 'OTHER') {
            const isOther =
              ['ACCOMMODATION', 'LEISURE', 'LAUNDRY', 'FITNESS', 'OTHER'].includes(c) ||
              cName.includes('숙박') ||
              cName.includes('기타') ||
              cName.includes('서비스') ||
              cName.includes('소상공인');
            if (!isOther) return false;
          }
        }

        // 3. 거리 필터
        if (distanceFilter !== 'ALL') {
          if (store.distKm < 0 || store.distKm > distanceFilter) {
            return false;
          }
        }

        // 4. 검색어 필터
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchStore =
            store.storeName?.toLowerCase().includes(q) ||
            store.ownerName?.toLowerCase().includes(q) ||
            store.address?.toLowerCase().includes(q) ||
            store.categoryName?.toLowerCase().includes(q) ||
            store.menuTestTitle?.toLowerCase().includes(q) ||
            store.menuTestReward?.toLowerCase().includes(q);

          if (matchStore) return true;

          const matchItems = (store.exchangeItems || []).some(
            (it) =>
              it.title?.toLowerCase().includes(q) ||
              it.description?.toLowerCase().includes(q)
          );

          if (matchItems) return true;

          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DISTANCE') {
          if (a.distKm < 0) return 1;
          if (b.distKm < 0) return -1;
          return a.distKm - b.distKm;
        }
        if (sortBy === 'TRADES') {
          const countA = a.tradeCount || 0;
          const countB = b.tradeCount || 0;
          if (countB !== countA) return countB - countA;
          // 성사 건수가 같을 때 활동 지수: 물물교환 활성(10점) + 신메뉴 모집(5점) + 등록 품목 수
          const actA = (a.breakTimeActive ? 10 : 0) + (a.isMenuTesting ? 5 : 0) + (a.exchangeItems?.length || 0);
          const actB = (b.breakTimeActive ? 10 : 0) + (b.isMenuTesting ? 5 : 0) + (b.exchangeItems?.length || 0);
          if (actB !== actA) return actB - actA;
          return (a.distKm >= 0 ? a.distKm : 9999) - (b.distKm >= 0 ? b.distKm : 9999);
        }
        return (a.storeName || '').localeCompare(b.storeName || '', 'ko-KR');
      });
  }, [storesWithDistance, statusFilter, categoryFilter, distanceFilter, searchQuery, sortBy]);

  const menuTestCount = useMemo(() => stores.filter((s) => s.isMenuTesting).length, [stores]);
  const exchangeReadyCount = useMemo(
    () =>
      stores.filter(
        (s) =>
          s.breakTimeActive ||
          s.voucherActive ||
          Boolean(s.exchangeItems && s.exchangeItems.length > 0)
      ).length,
    [stores]
  );

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    distanceFilter !== 'ALL' ||
    sortBy !== 'DISTANCE';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setDistanceFilter('ALL');
    setSortBy('DISTANCE');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-4xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. 상단 헤더: 모바일 잘림 방지 및 깔끔한 배치 */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-base sm:text-lg shadow-xs flex-shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm sm:text-lg text-gray-950 flex items-center gap-1.5 truncate break-keep">
                <span>우리 동네 가맹점</span>
                <span className="text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex-shrink-0">
                  {filteredStores.length}곳
                </span>
              </h2>
              <p className="text-xs text-gray-500 truncate hidden sm:block">
                지도 핀 탐색 없이 원하는 조건으로 모아보고 바로 신청하세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">지도로 보기</span>
              <span className="sm:hidden">지도</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 필터 및 검색 컨트롤 패널 */}
        <div className="bg-gray-50/90 border-b border-gray-200 px-3.5 py-3 sm:p-4 space-y-2.5">
          
          {/* 검색 입력창 */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="매장명, 메뉴, 동네 주소 검색..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 상태 필터 알약 (신메뉴 시식단 / 물물교환) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-touch py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              전체 매장 ({stores.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('MENU_TEST')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'MENU_TEST'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                  : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              <span>🧪</span>
              <span>신메뉴 시식단</span>
              <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'MENU_TEST' ? 'bg-white text-purple-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {menuTestCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('EXCHANGE_READY')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'EXCHANGE_READY'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-50'
              }`}
            >
              <span>☕</span>
              <span>물물교환 가능</span>
              <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'EXCHANGE_READY' ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {exchangeReadyCount}
              </span>
            </button>
          </div>

          {/* 카테고리 칩: 가로 스크롤로 글자 쪼개짐 방지 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-touch py-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('FOOD')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                categoryFilter === 'FOOD'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Utensils className="w-3 h-3 text-orange-600" />
              <span>요식·카페</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('RETAIL')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                categoryFilter === 'RETAIL'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-3 h-3 text-emerald-600" />
              <span>유통·신선</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('BEAUTY')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                categoryFilter === 'BEAUTY'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>뷰티·케어</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('OTHER')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                categoryFilter === 'OTHER'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <StoreIcon className="w-3 h-3 text-indigo-500" />
              <span>기타·서비스</span>
            </button>
          </div>

          {/* 거리 및 정렬 서브 툴바 (거래 많은 순 도입) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <select
                  value={distanceFilter}
                  onChange={(e) =>
                    setDistanceFilter(
                      e.target.value === 'ALL'
                        ? 'ALL'
                        : (Number(e.target.value) as DistanceFilterType)
                    )
                  }
                  className="bg-transparent outline-none cursor-pointer text-xs font-bold"
                >
                  <option value="ALL">전체 거리</option>
                  <option value="1">1km 이내</option>
                  <option value="3">3km 이내</option>
                  <option value="5">5km 이내</option>
                  <option value="10">10km 이내</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-extrabold outline-none cursor-pointer shadow-2xs"
              >
                <option value="DISTANCE">가까운 순</option>
                <option value="TRADES">🔥 거래 많은 순</option>
                <option value="NAME">매장명 순</option>
              </select>
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>초기화</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. 매장 카드 스트림 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-gray-100/70">
          {filteredStores.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-gray-200 p-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl mx-auto">
                🔍
              </div>
              <h3 className="font-extrabold text-base text-gray-800 break-keep">
                조건에 맞는 가맹점을 찾지 못했습니다
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto break-keep">
                검색어를 변경하시거나, 거리 또는 카테고리 필터를 초기화해 보세요.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>필터 전체 초기화</span>
              </button>
            </div>
          ) : (
            filteredStores.map((store) => {
              const isMyStore = myStore?.id && store.id === myStore.id;
              const hasVoucher = store.voucherActive || (store.exchangeItems || []).some((it) => it.isVoucher);
              const regularItems = (store.exchangeItems || []).filter((it) => !it.isVoucher);
              const formattedDist = store.distKm >= 0 ? formatDistance(store.distKm) : '';
              const walkTime = store.distKm >= 0 ? estimateWalkTime(store.distKm) : '';

              return (
                <div
                  key={store.id}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col break-keep"
                >
                  {/* 카드 상단 정보: 썸네일 + 기본 정보 + 거래 성사 횟수 뱃지 */}
                  <div className="p-4 sm:p-5 flex items-start gap-3.5 border-b border-gray-100">
                    {/* 매장 썸네일 */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 flex-shrink-0 shadow-2xs">
                      <img
                        src={store.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                        alt={store.storeName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                      {isMyStore && (
                        <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-black py-0.5 text-center">
                          우리 매장
                        </span>
                      )}
                    </div>

                    {/* 매장 텍스트 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 1행: 상태 및 거래 성사 배지 모음 */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-black bg-orange-100 text-orange-800 rounded-md whitespace-nowrap">
                          {store.categoryName || '소상공인'}
                        </span>
                        {store.isVerified && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>사장님 인증</span>
                          </span>
                        )}
                        {/* 🤝 거래 성사 횟수 표기 (신뢰도 핵심 뱃지) */}
                        <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 whitespace-nowrap flex items-center gap-0.5">
                          🤝 성사 {store.tradeCount || 0}회
                        </span>
                        {store.isMenuTesting && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-purple-600 text-white rounded-md whitespace-nowrap flex items-center gap-0.5 shadow-2xs">
                            <span>🧪</span>
                            <span>시식단 모집</span>
                          </span>
                        )}
                        {store.breakTimeActive && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md whitespace-nowrap">
                            ☕ 교환 가능
                          </span>
                        )}
                      </div>

                      {/* 2행: 매장명 */}
                      <h3 className="font-black text-base sm:text-lg text-gray-950 tracking-tight leading-tight truncate">
                        {store.storeName}
                      </h3>

                      {/* 3행: 사장님 성함 및 주소 */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600 flex-wrap">
                        <span className="font-bold text-gray-800 whitespace-nowrap">{store.ownerName} 사장님</span>
                        {store.address && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-500 truncate max-w-[180px] sm:max-w-xs">{store.address}</span>
                          </>
                        )}
                      </div>

                      {/* 4행: 거리 안내 및 영업시간 */}
                      <div className="mt-1.5 flex items-center gap-3 text-xs flex-wrap">
                        {isMyStore ? (
                          <span className="text-blue-600 font-extrabold flex items-center gap-1 whitespace-nowrap text-xs">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            <span>내 매장 (현재 위치)</span>
                          </span>
                        ) : formattedDist ? (
                          <span className="text-orange-600 font-extrabold flex items-center gap-1 whitespace-nowrap text-xs">
                            <Navigation className="w-3.5 h-3.5 text-orange-500" />
                            <span>{formattedDist}</span>
                            {walkTime && <span className="text-orange-500 font-medium text-[11px]">({walkTime})</span>}
                          </span>
                        ) : null}

                        <span className="flex items-center gap-1 text-gray-500 whitespace-nowrap text-[11px]">
                          <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span>영업 <strong className="text-gray-700 font-bold">{store.breakTimeHours || '10:00 ~ 22:00'}</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 카드 바디: 신메뉴 시식단 배너 & 교환 가능 품목 */}
                  <div className="p-4 sm:p-5 space-y-3.5 flex-1 bg-white">
                    {/* 🧪 신메뉴 시식단 하이라이트 배너 */}
                    {store.isMenuTesting && (
                      <div className="rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-purple-900 text-white p-3.5 sm:p-4 shadow-sm space-y-2 border border-purple-400/30">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 text-[10px] font-black bg-purple-500 text-white rounded-full flex items-center gap-1 whitespace-nowrap shadow-xs">
                            <span>🧪</span> 신메뉴 시식단 모집 중
                          </span>
                          <span className="text-[11px] font-bold text-purple-200 whitespace-nowrap">
                            정원 {store.menuTestQuota || 5}명
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug break-keep">
                            {store.menuTestTitle || '가을 신메뉴 1호 시식단 모집'}
                          </h4>
                          <p className="text-xs text-purple-200 leading-relaxed break-keep">
                            🎁 제공 혜택: <strong className="text-amber-300 font-bold">{store.menuTestReward || '신메뉴 2인 무료 시식'}</strong>
                          </p>
                        </div>
                        {isMyStore ? (
                          <div className="w-full py-1.5 bg-purple-800/60 text-purple-200 text-center text-xs font-bold rounded-xl border border-purple-400/20">
                            👑 내 매장이 등록한 신메뉴 시식단입니다
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenMenuTestApply(store)}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-gray-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🧪</span>
                            <span>[{store.storeName}] 시식단 바로 신청하기</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* 🤝 교환 가능 품목 목록 (이미지 크기 소형화 & 가로 컴팩트 배치 적용) */}
                    {regularItems.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
                          <span className="flex items-center gap-1">
                            <span>📦</span> 등록된 교환 가능 품목 ({regularItems.length}개)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {regularItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 bg-gray-50/90 rounded-2xl border border-gray-200 flex items-center justify-between gap-2.5 hover:border-orange-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* 고정 크기 52px x 52px 소형 썸네일 (화면 전체 차지 방지) */}
                                <div className="w-13 h-13 min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200/80 flex-shrink-0 shadow-2xs">
                                  <img
                                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                                    alt={item.title}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <h5 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate break-keep">
                                    {item.title}
                                  </h5>
                                  <p className="text-xs font-black text-orange-600 whitespace-nowrap">
                                    약 {(item.estimatedPrice || 0).toLocaleString()}원
                                  </p>
                                </div>
                              </div>
                              {isMyStore ? (
                                <span className="text-[10px] font-extrabold text-gray-400 bg-gray-200/70 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
                                  내 품목
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenProposal(item)}
                                  className="px-3 py-1.5 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs whitespace-nowrap active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                                >
                                  맞교환 제안
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : hasVoucher ? (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-md whitespace-nowrap">
                            🎟️ VIP 상생 금액 이용권 발행 매장
                          </span>
                          <p className="text-xs font-bold text-gray-800 break-keep">
                            {store.storeName} {(store.voucherAmount || 30000).toLocaleString()}원 이용권
                          </p>
                        </div>
                        {!isMyStore && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenProposal({
                                id: `voucher-${store.id}`,
                                storeId: store.id,
                                title: `${store.storeName} ${(store.voucherAmount || 30000).toLocaleString()}원 상생 이용권`,
                                estimatedPrice: store.voucherAmount || 30000,
                                description: '전 메뉴 및 서비스 자유 이용',
                                type: 'VOUCHER',
                                imageUrl: store.storeImageUrl || '',
                                isAvailable: true,
                                isVoucher: true,
                              })
                            }
                            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs whitespace-nowrap active:scale-95 cursor-pointer"
                          >
                            금액권 교환 제안
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-500 font-medium break-keep">
                        ☕ 사장님이 가입 후 분위기를 둘러보고 계십니다. 1:1 대화로 편하게 소통해 보세요!
                      </div>
                    )}
                  </div>

                  {/* 카드 하단 액션 버튼 바 */}
                  <div className="p-3 sm:px-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStoreOnMap(store);
                        onClose();
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-xl border border-gray-300 transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>지도 위치 보기</span>
                    </button>

                    {!isMyStore && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(store)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-950 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                        <span>1:1 대화</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreListModal;
