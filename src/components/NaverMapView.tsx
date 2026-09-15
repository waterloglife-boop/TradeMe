import React, { useEffect, useRef, useState } from 'react';
import { Store } from '../types/trade';
import { Sparkles, Loader2 } from 'lucide-react';
import { MapView } from './MapView';

interface NaverMapViewProps {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  myStore: Store;
  pickedLocation?: { lat: number; lng: number };
  onMapClickPinLocation?: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    naver: any;
  }
}

export const NaverMapView: React.FC<NaverMapViewProps> = ({
  stores,
  selectedStore,
  onSelectStore,
  myStore,
  pickedLocation,
  onMapClickPinLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const naverMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const pickerMarkerRef = useRef<any>(null);
  
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [authFailed, setAuthFailed] = useState<boolean>(false);
  const [pinStyle, setPinStyle] = useState<'PILL' | 'MICRO'>('PILL');

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID || '8ek0m4smqn';

  // 1. Dynamic Script Injection strictly for Naver Maps JavaScript SDK v3 (ncpKeyId)
  useEffect(() => {
    if (!clientId) return;

    const checkNaverMaps = () => {
      if (window.naver && window.naver.maps) {
        setScriptLoaded(true);
        return true;
      }
      return false;
    };

    if (checkNaverMaps()) return;

    const scriptId = 'naver-map-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
      script.async = true;

      script.onload = () => {
        setScriptLoaded(true);
      };

      script.onerror = () => {
        setAuthFailed(true);
      };

      document.head.appendChild(script);
    }

    const timer = setInterval(() => {
      if (checkNaverMaps()) {
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [clientId]);

  // 1-1. 전역 마커 터치/클릭 브릿지 핸들러 등록 (모바일 브라우저 터치 이벤트 완벽 지원)
  useEffect(() => {
    let lastHandledTime = 0;
    (window as any).__onSelectStoreFromMap = (storeId: string) => {
      const now = Date.now();
      if (now - lastHandledTime < 250) return; // 탭/클릭 중복 이벤트 디바운스
      lastHandledTime = now;

      if (myStore && (myStore.id === storeId || storeId === 'my-store')) {
        onSelectStore(myStore);
        return;
      }
      const target = stores.find((s) => s.id === storeId);
      if (target) {
        onSelectStore(target);
      }
    };

    return () => {
      delete (window as any).__onSelectStoreFromMap;
    };
  }, [stores, myStore, onSelectStore]);

  // 2. Initialize Pure Naver Map Instance & Custom Store Pins
  useEffect(() => {
    if (!scriptLoaded || !window.naver || !window.naver.maps || !mapContainerRef.current) {
      return;
    }

    try {
      if (!naverMapInstanceRef.current) {
        // 실제 등록된 가맹점이 존재하고 기본 좌표가 서울일 경우, 가맹점 밀집 지역(양산)으로 스마트 중심 설정
        let initialLat = pickedLocation?.lat || 37.5665;
        let initialLng = pickedLocation?.lng || 126.9780;
        if (initialLat === 37.5665 && stores.length > 0 && stores[0]?.lat) {
          initialLat = stores[0].lat;
          initialLng = stores[0].lng;
        }

        const mapOptions = {
          center: new window.naver.maps.LatLng(initialLat, initialLng),
          zoom: 14,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.naver.maps.MapTypeControlStyle.BUTTON,
            position: window.naver.maps.Position.TOP_RIGHT,
          },
          zoomControl: true,
          zoomControlOptions: { position: window.naver.maps.Position.RIGHT_CENTER },
          logoControl: true,
          scaleControl: true,
        };
        naverMapInstanceRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

        if (onMapClickPinLocation) {
          window.naver.maps.Event.addListener(naverMapInstanceRef.current, 'click', (e: any) => {
            onMapClickPinLocation(e.coord.lat(), e.coord.lng());
          });
        }
      }

      const map = naverMapInstanceRef.current;

      // Clear Previous Markers
      Object.values(markersRef.current).forEach((m) => m.setMap && m.setMap(null));
      markersRef.current = {};

      const createMarkerHtml = (store: Store, isMyStore: boolean) => {
        const isSelected = selectedStore?.id === store.id;

        let iconEmoji = '🍽️';
        let iconBg = '#f1f5f9';
        let borderColor = '#cbd5e1';

        if (store.category === 'ACCOMMODATION') { iconEmoji = '🏨'; iconBg = '#e0f2fe'; }
        else if (store.category === 'JAPANESE') { iconEmoji = '🍣'; iconBg = '#fef3c7'; }
        else if (store.category === 'WESTERN') { iconEmoji = '🍝'; iconBg = '#fee2e2'; }
        else if (store.category === 'CAFE') { iconEmoji = '☕'; iconBg = '#ffedd5'; }
        else if (store.category === 'BEAUTY') { iconEmoji = '💅'; iconBg = '#fce7f3'; }
        else if (store.category === 'PUB') { iconEmoji = '🍺'; iconBg = '#fef9c3'; }
        else if (store.category === 'RETAIL') { iconEmoji = '🛍️'; iconBg = '#ecfccb'; }
        else if (store.category === 'SERVICE') { iconEmoji = '🧺'; iconBg = '#e0e7ff'; }

        // 미세하고 일관된 테두리 강조 (지저분한 상단 말풍선 일체 제거!)
        if (store.isMenuTesting) {
          borderColor = '#9333ea';
        } else if (store.breakTimeActive) {
          borderColor = '#f97316';
        }

        if (isMyStore) {
          iconEmoji = '👑';
          borderColor = '#2563eb';
          iconBg = '#dbeafe';
        }

        if (isSelected) {
          borderColor = '#ea580c';
        }

        // 📍 1. 초소형 마이크로 핀 모드 (26px 초소형 원형 핀)
        if (pinStyle === 'MICRO') {
          return `
            <div 
              data-store-id="${store.id}"
              onclick="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
              ontouchend="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
              style="
                position: absolute;
                transform: translate(-50%, -50%) ${isSelected ? 'scale(1.25)' : 'scale(1)'};
                transition: transform 0.15s ease;
                cursor: pointer;
                pointer-events: auto;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                z-index: ${isSelected ? '99' : isMyStore ? '50' : '10'};
                user-select: none;
              "
              title="${store.storeName}"
            >
              <div style="
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background: ${isMyStore ? '#eff6ff' : '#ffffff'};
                border: 2px solid ${borderColor};
                box-shadow: ${isSelected ? '0 4px 12px rgba(234, 88, 12, 0.45)' : '0 2px 5px rgba(0,0,0,0.15)'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
              ">
                ${iconEmoji}
              </div>
            </div>
          `;
        }

        // 🏷️ 2. 단정하고 컴팩트한 알약 핀 모드 (높이 27px, 일관된 디자인)
        return `
          <div 
            data-store-id="${store.id}"
            onclick="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
            ontouchend="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
            style="
              position: absolute;
              transform: translate(-50%, -100%) ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: transform 0.15s ease;
              cursor: pointer;
              pointer-events: auto;
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
              z-index: ${isSelected ? '99' : isMyStore ? '50' : '10'};
              user-select: none;
              display: flex;
              flex-direction: column;
              align-items: center;
            "
            title="${store.storeName}"
          >
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background: ${isMyStore ? '#eff6ff' : '#ffffff'};
              border: 1.5px solid ${borderColor};
              border-radius: 9999px;
              padding: 2.5px 7px 2.5px 4px;
              box-shadow: ${isSelected ? '0 4px 14px rgba(234, 88, 12, 0.4)' : '0 2px 6px rgba(0,0,0,0.12)'};
              white-space: nowrap;
            ">
              <span style="
                width: 19px;
                height: 19px;
                border-radius: 50%;
                background: ${iconBg};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                flex-shrink: 0;
              ">${iconEmoji}</span>
              <span style="
                font-size: 11px;
                font-weight: 800;
                color: #1e293b;
                letter-spacing: -0.3px;
                max-width: 90px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${store.storeName}</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 3.5px solid transparent;
              border-right: 3.5px solid transparent;
              border-top: 4px solid ${borderColor};
            "></div>
          </div>
        `;
      };

      // Render My Store Marker (필터 적용 시 myStore가 필터 결과에 포함된 경우에만 노출)
      const isMyStoreInFiltered = stores.some((s) => s.id === myStore?.id);
      if (isMyStoreInFiltered && myStore && typeof myStore.lat === 'number' && typeof myStore.lng === 'number' && !isNaN(myStore.lat) && !isNaN(myStore.lng)) {
        const myMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(myStore.lat, myStore.lng),
          map,
          title: myStore.storeName || '내 매장',
          icon: { content: createMarkerHtml(myStore, true), anchor: new window.naver.maps.Point(0, 0) },
        });
        const handleMyStoreSelect = (e?: any) => {
          if (e?.domEvent) {
            e.domEvent.stopPropagation?.();
          }
          onSelectStore(myStore);
        };
        window.naver.maps.Event.addListener(myMarker, 'click', handleMyStoreSelect);
        window.naver.maps.Event.addListener(myMarker, 'tap', handleMyStoreSelect);
        markersRef.current[myStore.id || 'my-store'] = myMarker;
      }

      // Render Other Stores Markers
      stores.forEach((store) => {
        if (!store || typeof store.lat !== 'number' || typeof store.lng !== 'number' || isNaN(store.lat) || isNaN(store.lng)) return;
        if (myStore?.id && store.id === myStore.id) return;
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(store.lat, store.lng),
          map,
          title: store.storeName,
          icon: { content: createMarkerHtml(store, false), anchor: new window.naver.maps.Point(0, 0) },
        });
        const handleStoreSelect = (e?: any) => {
          if (e?.domEvent) {
            e.domEvent.stopPropagation?.();
          }
          onSelectStore(store);
        };
        window.naver.maps.Event.addListener(marker, 'click', handleStoreSelect);
        window.naver.maps.Event.addListener(marker, 'tap', handleStoreSelect);
        markersRef.current[store.id] = marker;
      });
    } catch (err) {
      console.error('Naver Maps render notice:', err);
    }
  }, [scriptLoaded, stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation, pinStyle]);

  // 2-1. 매장 선택 시 해당 매장 위치로 지도 부드럽게 중심 이동
  useEffect(() => {
    if (!scriptLoaded || !window.naver || !window.naver.maps || !naverMapInstanceRef.current || !selectedStore) return;
    try {
      if (typeof selectedStore.lat === 'number' && typeof selectedStore.lng === 'number') {
        const targetPos = new window.naver.maps.LatLng(selectedStore.lat, selectedStore.lng);
        naverMapInstanceRef.current.panTo(targetPos);
      }
    } catch (e) {}
  }, [scriptLoaded, selectedStore]);

  // 2-2. [상태 동기화 및 핀 이동 로직 구현] Naver Geocoding 좌표 변경 시 지도 핀 및 중심점 자동 이동
  useEffect(() => {
    if (!scriptLoaded || !window.naver || !window.naver.maps || !naverMapInstanceRef.current || !pickedLocation) return;
    try {
      const map = naverMapInstanceRef.current;
      const newPos = new window.naver.maps.LatLng(pickedLocation.lat, pickedLocation.lng);

      map.panTo(newPos);

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setPosition(newPos);
      } else {
        pickerMarkerRef.current = new window.naver.maps.Marker({
          position: newPos,
          map,
          title: '선택된 도로명 주소 위치',
          icon: {
            content: `<div style="width: 34px; height: 34px; border-radius: 50%; background: #dc2626; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; box-shadow: 0 4px 12px rgba(220,38,38,0.5);">📍</div>`,
            anchor: new window.naver.maps.Point(17, 17),
          },
        });
      }
    } catch (e) {
      // Fallback gracefully
    }
  }, [scriptLoaded, pickedLocation]);

  // Loading Screen
  if (!scriptLoaded && !authFailed) {
    return (
      <div className="relative w-full h-[calc(100vh-100px)] min-h-[580px] bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <h3 className="font-extrabold text-gray-900 text-sm">
            🗺️ 지도 (Naver Maps SDK) 로딩 중...
          </h3>
        </div>
      </div>
    );
  }

  // Auth Error Emergency Fallback
  if (authFailed) {
    return (
      <MapView
        stores={stores}
        selectedStore={selectedStore}
        onSelectStore={onSelectStore}
        myStore={myStore}
        onMapClickPinLocation={onMapClickPinLocation}
      />
    );
  }

  return (
    <div className="relative w-full h-[calc(100dvh-260px)] min-h-[380px] max-h-[520px] md:h-[calc(100vh-100px)] md:min-h-[580px] md:max-h-none overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 📍 지도 핀 표시 방식 스위처 (알약 핀 ↔ 초소형 핀) */}
      <div className="absolute bottom-6 left-4 z-20 flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-gray-200/90 text-xs font-black select-none">
        <button
          type="button"
          onClick={() => setPinStyle('PILL')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
            pinStyle === 'PILL'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="매장명과 아이콘이 함께 깔끔하게 표시되는 콤팩트 알약 핀"
        >
          <span>🏷️</span>
          <span>알약 핀</span>
        </button>
        <button
          type="button"
          onClick={() => setPinStyle('MICRO')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
            pinStyle === 'MICRO'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="매장이 많아져도 겹치지 않는 초소형 미니 핀"
        >
          <span>📍</span>
          <span>초소형 핀</span>
        </button>
      </div>
    </div>
  );
};
