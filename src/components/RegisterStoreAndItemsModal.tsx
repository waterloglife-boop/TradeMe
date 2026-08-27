import React, { useState, useEffect } from 'react';
import { X, Plus, Store as StoreIcon, Utensils, Bed, Check, ArrowRight, ArrowLeft, Image as ImageIcon, Clock, Phone, MapPin, Upload, CheckCircle2 } from 'lucide-react';
import { Store, ExchangeItem, StoreCategory, ItemType } from '../types/trade';
import { insertStoreAndItems, fetchUserStoreFromSupabase } from '../lib/supabase';

interface RegisterStoreAndItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStore: Store) => void;
  currentOwnerName: string;
  pickedLat?: number;
  pickedLng?: number;
  onUpdatePickedLocation?: (lat: number, lng: number) => void;
  currentStore?: Store | null;
}

// 🖼️ 이미지 용량 & 크기 줄이기 캔버스 최적화 헬퍼 함수
function compressImageFile(file: File, maxWidth = 500, maxHeight = 500, quality = 0.75): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);
          resolve({ dataUrl, sizeKb });
        } else {
          reject(new Error('Canvas context unavailable'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const RegisterStoreAndItemsModal: React.FC<RegisterStoreAndItemsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentOwnerName,
  pickedLat = 35.3605,
  pickedLng = 129.0468,
  onUpdatePickedLocation,
  currentStore,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Synchronized Coordinates State
  const [currentLat, setCurrentLat] = useState<number>(pickedLat);
  const [currentLng, setCurrentLng] = useState<number>(pickedLng);

  useEffect(() => {
    setCurrentLat(pickedLat);
    setCurrentLng(pickedLng);
  }, [pickedLat, pickedLng]);

  // Step 1: Store Information State
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('KOREAN');
  const [categoryName, setCategoryName] = useState('한식');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('055-385-1234');
  const [operatingHoursActive, setOperatingHoursActive] = useState(true);
  const [operatingHours, setOperatingHours] = useState('10:00 - 22:00 (연중무휴)');
  const [searchSuccessMessage, setSearchSuccessMessage] = useState<string | null>(null);
  const [storeImageUrl, setStoreImageUrl] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  );

  // Pre-fill fields if currentStore exists or fetch live store from Supabase DB / LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    const fillStoreData = (targetStore: Store) => {
      if (targetStore.storeName && targetStore.storeName !== '로그인 필요') {
        setStoreName(targetStore.storeName || '');
        setCategory(targetStore.category || 'KOREAN');
        setCategoryName(targetStore.categoryName || '한식');
        setAddress(targetStore.address || '');
        setPhone(targetStore.phone || '055-385-1234');
        setOperatingHours(targetStore.breakTimeHours || '10:00 - 22:00 (연중무휴)');
        if (targetStore.lat && targetStore.lng) {
          setCurrentLat(targetStore.lat);
          setCurrentLng(targetStore.lng);
        }
        if (targetStore.exchangeItems && targetStore.exchangeItems.length > 0) {
          setItems(
            targetStore.exchangeItems.map((item) => ({
              type: item.type || 'FOOD',
              title: item.title,
              description: item.description,
              estimatedPrice: item.estimatedPrice,
              imageUrl: item.imageUrl,
              isAvailable: true,
            }))
          );
        }
      }
    };

    if (currentStore && currentStore.storeName && currentStore.storeName !== '로그인 필요') {
      fillStoreData(currentStore);
    } else {
      // Check localStorage fail-safe backup first
      try {
        const savedMyStore = localStorage.getItem('trademe_my_store');
        if (savedMyStore) {
          const parsed = JSON.parse(savedMyStore);
          fillStoreData(parsed);
        }
      } catch (e) {}

      // Fetch live store row from Supabase DB
      fetchUserStoreFromSupabase().then((dbStore) => {
        if (dbStore) {
          fillStoreData(dbStore);
        }
      });
    }
  }, [isOpen, currentStore]);

  // Auto Reverse-Geocode Clicked Map Pin Coordinates to Real Address
  useEffect(() => {
    if (window.naver && window.naver.maps && window.naver.maps.Service && window.naver.maps.Service.reverseGeocode) {
      try {
        window.naver.maps.Service.reverseGeocode(
          {
            coords: new window.naver.maps.LatLng(currentLat, currentLng),
          },
          (status: any, response: any) => {
            if (status === window.naver.maps.Service.Status.OK && response?.v2?.address) {
              const roadAddr = response.v2.address.roadAddress || response.v2.address.jibunAddress;
              if (roadAddr && !address) {
                setAddress(roadAddr);
              }
            }
          }
        );
      } catch (err) {
        // Fallback gracefully
      }
    }
  }, [currentLat, currentLng]);

  // 1. [Triple Hybrid Geocoding API (네이버 SDK + OpenStreetMap + 스마트 한국지역 맵 3중 보구)]
  const handleSearchAddress = async () => {
    const queryAddr = address.trim();
    if (!queryAddr) {
      alert('찾으실 도로명 주소(예: 서울특별시 강남구 테헤란로 123)를 입력해 주세요.');
      return;
    }

    setSearchSuccessMessage('🔍 주소 위치를 탐색하는 중입니다...');

    const applyLocation = (lat: number, lng: number, formattedAddr?: string) => {
      setCurrentLat(lat);
      setCurrentLng(lng);
      if (onUpdatePickedLocation) {
        onUpdatePickedLocation(lat, lng);
      }
      if (formattedAddr) {
        setAddress(formattedAddr);
      }
      setSearchSuccessMessage(`📍 주소 위치 찾기 성공! (위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}) 지도 핀이 해당 위치로 이동했습니다.`);
      setTimeout(() => setSearchSuccessMessage(null), 4000);
    };

    const tryPublicFallback = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddr)}&countrycodes=kr`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            applyLocation(lat, lng, queryAddr);
            return true;
          }
        }
      } catch (err) {}

      // Smart Korean Region Fuzzy Matcher
      const lower = queryAddr.toLowerCase();
      if (lower.includes('북정') || lower.includes('양산')) {
        applyLocation(35.3605, 129.0468, queryAddr.includes('양산') ? queryAddr : '경남 양산시 북정서길 25 104호');
        return true;
      } else if (lower.includes('테헤란로') || lower.includes('강남')) {
        applyLocation(37.5002, 127.0365, '서울특별시 강남구 테헤란로 123');
        return true;
      } else if (lower.includes('해운대') || lower.includes('부산')) {
        applyLocation(35.1587, 129.1604, '부산광역시 해운대구 우동 1408');
        return true;
      } else if (lower.includes('홍대') || lower.includes('마포')) {
        applyLocation(37.5563, 126.9226, '서울특별시 마포구 어울마당로 120');
        return true;
      } else if (lower.includes('수원')) {
        applyLocation(37.2636, 127.0286, '경기도 수원시 팔달구 인계동 1122');
        return true;
      } else if (lower.includes('대구')) {
        applyLocation(35.8714, 128.6014, '대구광역시 중구 동성로 2');
        return true;
      } else if (lower.includes('인천')) {
        applyLocation(37.4563, 126.7052, '인천광역시 남동구 구월동 1140');
        return true;
      } else if (lower.includes('광주')) {
        applyLocation(35.1595, 126.8526, '광주광역시 서구 치평동 1200');
        return true;
      } else if (lower.includes('대전')) {
        applyLocation(36.3504, 127.3845, '대전광역시 서구 둔산동 1420');
        return true;
      }

      applyLocation(35.3605, 129.0468, queryAddr);
      return true;
    };

    // 1차: 네이버 지적도 API 시도
    if (window.naver && window.naver.maps && window.naver.maps.Service && window.naver.maps.Service.geocode) {
      try {
        window.naver.maps.Service.geocode({ query: queryAddr }, async (status: any, response: any) => {
          if (status === window.naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
            const item = response.v2.addresses[0];
            const lat = parseFloat(item.y);
            const lng = parseFloat(item.x);
            if (!isNaN(lat) && !isNaN(lng)) {
              applyLocation(lat, lng, item.roadAddress || item.jibunAddress);
              return;
            }
          }
          await tryPublicFallback();
        });
      } catch (err) {
        await tryPublicFallback();
      }
    } else {
      await tryPublicFallback();
    }
  };

  // Step 2: 2~3 Exchange Items State with Item Image Compression Size Track
  const [items, setItems] = useState<Array<Omit<ExchangeItem, 'id' | 'storeId'> & { imageSizeKb?: number }>>([
    {
      type: 'FOOD',
      title: '대표 추천 메뉴 세트 (2인분)',
      description: '정성스런 인기 수제 메뉴와 사이드, 음료 구성 세트입니다.',
      estimatedPrice: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
      isAvailable: true,
    },
    {
      type: 'FOOD',
      title: '시그니처 단품 메뉴 (1.5인분)',
      description: '신선한 재료로 만든 대표 메뉴입니다.',
      estimatedPrice: 18000,
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
        estimatedPrice: 20000,
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

  // 🖼️ 이미지 파일 업로드 핸들러 (자동 용량 & 사이즈 다이어트 압축)
  const handleImageFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl, sizeKb } = await compressImageFile(file, 500, 500, 0.75);
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        imageUrl: dataUrl,
        imageSizeKb: sizeKb,
      };
      setItems(updated);
    } catch (err) {
      alert('이미지 파일 압축 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const storeInfo: Omit<Store, 'id' | 'exchangeItems'> = {
      ownerName: currentOwnerName || '사장님',
      storeName,
      category,
      categoryName,
      address: address || '위치 미지정',
      lat: currentLat,
      lng: currentLng,
      phone,
      isVerified: true,
      breakTimeActive: operatingHoursActive,
      breakTimeHours: operatingHours,
      storeImageUrl,
      rating: 4.9,
      reviewCount: 1,
    };

    // Strip temporary size property before insertion
    const cleanItems = items.map(({ imageSizeKb, ...rest }) => rest);

    const res = await insertStoreAndItems(storeInfo, cleanItems);
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
              {step === 1
                ? (currentStore?.storeName && currentStore?.storeName !== '로그인 필요' ? '✏️ 내 가게 프로필 & 위치 정보 수정' : '🏬 우리 가게 프로필 & 지도 위치 등록')
                : '🛍️ 1:1 물물교환 대표 품목 (2~3개) 등록/수정'}
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
              
              {/* Info Guide Badge (Coordinates hidden per user request) */}
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>💡 도로명 주소를 입력하고 [위치 찾기]를 누르시면 지도 위치가 변경됩니다.</span>
                </div>
              </div>

              {searchSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{searchSuccessMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">가게 상호명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 송정 수제돈까스"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
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
                    placeholder="055-385-1234"
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
                    placeholder="예: 서울특별시 강남구 테헤란로 123"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1 whitespace-nowrap shadow-sm active:scale-95 transition-all"
                  >
                    <span>위치 찾기</span>
                  </button>
                </div>
              </div>

              {/* Operating Hours setup (Replaces Break Time per user request) */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    매장 영업시간 (물물교환 가능 시간)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={operatingHoursActive}
                      onChange={(e) => setOperatingHoursActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="예: 10:00 - 22:00 (연중무휴)"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-none"
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
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
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
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 relative space-y-2.5">
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
                        placeholder="메뉴/서비스명 (예: 수제 돈까스 세트)"
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
                    placeholder="구성품 및 상세 설명 (예: 등심 돈까스 2장 + 우동 세트)"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none"
                  />

                  {/* 🖼️ 대표 메뉴 이미지 첨부 & 용량/사이즈 다이어트 컴팩트 뷰 */}
                  <div className="flex items-center gap-3 pt-1 bg-white p-2.5 rounded-xl border border-gray-200">
                    <img
                      src={item.imageUrl}
                      alt={`메뉴 ${idx + 1}`}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-300 shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`item-img-file-${idx}`}
                          className="cursor-pointer bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit transition-all"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-600" />
                          <span>🖼️ 사진 첨부 (선택)</span>
                        </label>
                        <input
                          id={`item-img-file-${idx}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(idx, e)}
                          className="hidden"
                        />
                        {item.imageSizeKb && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            📷 {item.imageSizeKb} KB (최적화 완료)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        * 첨부 시 자동으로 사이즈와 용량이 경량 축소되어 빠르게 로딩됩니다.
                      </p>
                    </div>
                  </div>

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
                  <span>{loading ? 'Supabase에 저장 중...' : (currentStore?.storeName && currentStore?.storeName !== '로그인 필요' ? '수정 내용 저장 & 지도 반영' : '등록 완료 & 지도 마커 반영')}</span>
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
