import React, { useState, useEffect } from 'react';
import { X, Plus, Store as StoreIcon, Utensils, Bed, Check, ArrowRight, ArrowLeft, Image as ImageIcon, Clock, Phone, MapPin } from 'lucide-react';
import { Store, ExchangeItem, StoreCategory, ItemType } from '../types/trade';
import { insertStoreAndItems } from '../lib/supabase';

interface RegisterStoreAndItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStore: Store) => void;
  currentOwnerName: string;
  pickedLat?: number;
  pickedLng?: number;
  onUpdatePickedLocation?: (lat: number, lng: number) => void;
}

export const RegisterStoreAndItemsModal: React.FC<RegisterStoreAndItemsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentOwnerName,
  pickedLat = 35.3605,
  pickedLng = 129.0468,
  onUpdatePickedLocation,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Store Information State
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('KOREAN');
  const [categoryName, setCategoryName] = useState('한식');
  const [address, setAddress] = useState('경남 양산시 북정서길 25 (북정동)');
  const [phone, setPhone] = useState('055-385-1234');
  const [breakTimeActive, setBreakTimeActive] = useState(true);
  const [breakTimeHours, setBreakTimeHours] = useState('15:00 - 17:00');
  const [storeImageUrl, setStoreImageUrl] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  );

  // Auto Reverse-Geocode Clicked Map Pin Coordinates to Real Address
  useEffect(() => {
    if (window.naver && window.naver.maps && window.naver.maps.Service && window.naver.maps.Service.reverseGeocode) {
      try {
        window.naver.maps.Service.reverseGeocode(
          {
            coords: new window.naver.maps.LatLng(pickedLat, pickedLng),
          },
          (status: any, response: any) => {
            if (status === window.naver.maps.Service.Status.OK && response?.v2?.address) {
              const roadAddr = response.v2.address.roadAddress || response.v2.address.jibunAddress;
              if (roadAddr) {
                setAddress(roadAddr);
              }
            }
          }
        );
      } catch (err) {
        // Fallback gracefully
      }
    }
  }, [pickedLat, pickedLng]);

  // 1. [Naver Geocoding API 연동 (주소 -> 좌표 변환)]
  const handleSearchAddress = () => {
    if (!address.trim()) return;
    if (window.naver && window.naver.maps && window.naver.maps.Service && window.naver.maps.Service.geocode) {
      try {
        window.naver.maps.Service.geocode({ query: address }, (status: any, response: any) => {
          if (status === window.naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
            const item = response.v2.addresses[0];
            const lat = parseFloat(item.y);
            const lng = parseFloat(item.x);
            if (!isNaN(lat) && !isNaN(lng)) {
              if (onUpdatePickedLocation) {
                onUpdatePickedLocation(lat, lng);
              }
              if (item.roadAddress) {
                setAddress(item.roadAddress);
              }
            }
          } else {
            alert('입력하신 주소의 위치를 찾을 수 없습니다. 도로명 주소를 정확히 입력해 주세요.');
          }
        });
      } catch (err) {
        console.warn('Geocoding search notice:', err);
      }
    }
  };

  // Step 2: 2~3 Exchange Items State
  const [items, setItems] = useState<Array<Omit<ExchangeItem, 'id' | 'storeId'>>>([
    {
      type: 'FOOD',
      title: '특선 양념 갈비 세트 (2인분)',
      description: '참숯 직화 초벌 구이 및 파채, 야채 포장 세트입니다.',
      estimatedPrice: 32000,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
      isAvailable: true,
    },
    {
      type: 'FOOD',
      title: '한우 차돌 된장찌개 & 비빔밥 세트',
      description: '깊은 맛의 차돌 된장찌개와 나물 비빔밥 2인 세트.',
      estimatedPrice: 26000,
      imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80',
      isAvailable: true,
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (items.length >= 3) {
      alert('1:1 물물교환 대표 품목은 최대 3개까지 등록 가능합니다.');
      return;
    }
    setItems([
      ...items,
      {
        type: 'FOOD',
        title: '',
        description: '',
        estimatedPrice: 25000,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
        isAvailable: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('최소 1개 이상의 대표 교환 품목을 등록해야 합니다.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const storeInfo: Omit<Store, 'id' | 'exchangeItems'> = {
      ownerName: currentOwnerName,
      storeName,
      category,
      categoryName,
      address,
      lat: pickedLat,
      lng: pickedLng,
      phone,
      isVerified: true,
      breakTimeActive,
      breakTimeHours,
      storeImageUrl,
      rating: 4.9,
      reviewCount: 1,
    };

    const res = await insertStoreAndItems(storeInfo, items);
    setLoading(false);

    if (res.success && res.store) {
      onSuccess(res.store);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex-shrink-0">
          <div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
              STEP {step} / 2
            </span>
            <h2 className="font-extrabold text-base mt-1">
              {step === 1 ? '🏬 우리 가게 프로필 & 지도 위치 등록' : '🛍️ 1:1 물물교환 대표 품목 (2~3개) 등록'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Picked Location Coordinates Badge */}
              <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-orange-900 font-bold">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>선택된 핀 좌표: {pickedLat.toFixed(4)}, {pickedLng.toFixed(4)}</span>
                </div>
                <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 rounded font-bold">
                  위치 좌표 확정
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">가게 상호명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 송정 수제돈까스"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">업종 카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as StoreCategory;
                      setCategory(cat);
                      const nameMap: Record<string, string> = {
                        KOREAN: '한식',
                        JAPANESE: '일식',
                        WESTERN: '양식',
                        CHINESE: '중식',
                        SNACK: '분식',
                        CAFE: '카페/디저트',
                        PUB: '주점/호프',
                        CONVENIENCE: '편의점',
                        BAKERY: '베이커리/떡집',
                        FRESH_FOOD: '정육/수산/과일',
                        BEAUTY: '뷰티/케어',
                        ACCOMMODATION: '숙박/펜션',
                        LEISURE: '레저/체험',
                        LAUNDRY: '세탁/수리',
                        FITNESS: '헬스/스포츠',
                        OTHER: '기타 서비스',
                      };
                      setCategoryName(nameMap[cat] || '기타 서비스');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="KOREAN">🍱 한식</option>
                    <option value="JAPANESE">🍣 일식</option>
                    <option value="WESTERN">🍝 양식</option>
                    <option value="CHINESE">🥟 중식</option>
                    <option value="SNACK">🍢 분식</option>
                    <option value="CAFE">☕ 카페/디저트</option>
                    <option value="PUB">🍺 주점/호프</option>
                    <option value="CONVENIENCE">🏪 편의점</option>
                    <option value="BAKERY">🍞 베이커리/떡집</option>
                    <option value="FRESH_FOOD">🥩 정육/수산/과일</option>
                    <option value="BEAUTY">💄 뷰티 (미용/네일/피부)</option>
                    <option value="ACCOMMODATION">🏨 숙박 (호텔/펜션)</option>
                    <option value="LEISURE">🏄 레저/체험</option>
                    <option value="LAUNDRY">🧺 세탁/수리</option>
                    <option value="FITNESS">💪 헬스/스포츠</option>
                    <option value="OTHER">🔮 기타 서비스</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">전화번호</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">가게 도로명 주소 검색/입력</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAddress();
                      }
                    }}
                    placeholder="예: 경남 양산시 북정서길 25"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 whitespace-nowrap shadow-sm"
                  >
                    <span>위치 찾기</span>
                  </button>
                </div>
              </div>

              {/* Break time setup */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    브레이크 타임 (교환 가능 시간)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={breakTimeActive}
                      onChange={(e) => setBreakTimeActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="예: 15:00 - 17:00"
                  value={breakTimeHours}
                  onChange={(e) => setBreakTimeHours(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!storeName) {
                      alert('가게 상호명을 입력해 주세요.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>다음: 1:1 물물교환 품목 등록 (Step 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 font-bold">
                  상대 사장님과 1:1로 교환할 대표 메뉴 (현재 {items.length}개)
                </p>
                {items.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> 메뉴 추가 (+1)
                  </button>
                )}
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 relative space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-orange-600">대표 메뉴 #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-xs text-red-500 hover:underline font-bold"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="메뉴/서비스명 (예: 양념돼지갈비 2인분)"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        step="1000"
                        placeholder="추정가 (원)"
                        value={item.estimatedPrice}
                        onChange={(e) => handleItemChange(idx, 'estimatedPrice', Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="구성품 및 상세 설명 (포장, 상추, 양념장 포함 등)"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
              ))}

              <div className="pt-3 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> 이전
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Supabase에 저장 중...' : '등록 완료 & 지도 마커 반영'}</span>
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
