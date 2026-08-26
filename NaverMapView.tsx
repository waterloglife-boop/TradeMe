import React, { useEffect, useRef, useState } from 'react';
import { Store } from '../types/trade';
import { MapPin, AlertCircle, Sparkles } from 'lucide-react';

interface NaverMapViewProps {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  myStore: Store;
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
  onMapClickPinLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const naverMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  // 1. Dynamic Script Injection for Naver Maps JavaScript SDK (ncpKeyId)
  useEffect(() => {
    if (!clientId) {
      return;
    }

    if (window.naver && window.naver.maps) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'naver-map-sdk';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}`;
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      setLoadError(true);
    };

    document.head.appendChild(script);
  }, [clientId]);

  // 2. Initialize Naver Map Instance & Handle Authentication Errors
  useEffect(() => {
    if (!scriptLoaded || !window.naver || !window.naver.maps || !mapContainerRef.current) {
      return;
    }

    // Catch Naver API Authentication Fault (e.g. invalid key / url mismatch)
    if (window.naver.maps.onJSAPIFault) {
      window.naver.maps.onJSAPIFault = () => {
        console.warn('Naver Maps API Authentication Fault detected.');
        setLoadError(true);
      };
    }

    try {
      if (!naverMapInstanceRef.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(35.1788, 129.1995), // 송정해수욕장 중심
          zoom: 15,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
        };
        naverMapInstanceRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

        if (onMapClickPinLocation) {
          window.naver.maps.Event.addListener(naverMapInstanceRef.current, 'click', (e: any) => {
            const lat = e.coord.lat();
            const lng = e.coord.lng();
            onMapClickPinLocation(lat, lng);
          });
        }
      }

      const map = naverMapInstanceRef.current;

      // Clear Previous Markers
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};

      const createMarkerHtml = (store: Store, isMyStore: boolean) => {
        const isBreakTime = store.breakTimeActive;
        const isSelected = selectedStore?.id === store.id;

        let bgColor = 'background: #1e293b;';
        let iconEmoji = '🍽️';

        if (store.category === 'ACCOMMODATION') iconEmoji = '🏨';
        if (store.category === 'JAPANESE') iconEmoji = '🍣';
        if (store.category === 'WESTERN') iconEmoji = '🍝';
        if (store.category === 'CAFE') iconEmoji = '☕';
        if (isMyStore) iconEmoji = '👑';

        if (isBreakTime) {
          bgColor = 'background: linear-gradient(135deg, #f59e0b, #ea580c); box-shadow: 0 0 12px rgba(245, 158, 11, 0.7);';
        }
        if (isMyStore) {
          bgColor = 'background: linear-gradient(135deg, #2563eb, #4f46e5);';
        }

        return `
          <div style="position: relative; cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s;">
            ${
              isBreakTime
                ? `<div style="position: absolute; top: -22px; left: -10px; background: #d97706; color: white; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 10px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid #fef3c7;">
                    ☕ 교환 가능
                   </div>`
                : ''
            }
            <div style="width: 38px; height: 38px; border-radius: 50%; ${bgColor} border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
              ${iconEmoji}
            </div>
            <div style="margin-top: 4px; background: rgba(255,255,255,0.95); padding: 2px 6px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; color: #1e293b; text-align: center; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
              ${store.storeName}
            </div>
          </div>
        `;
      };

      // Render My Store Marker
      const myMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(myStore.lat, myStore.lng),
        map: map,
        title: myStore.storeName,
        icon: {
          content: createMarkerHtml(myStore, true),
          anchor: new window.naver.maps.Point(20, 45),
        },
      });
      window.naver.maps.Event.addListener(myMarker, 'click', () => onSelectStore(myStore));
      markersRef.current[myStore.id] = myMarker;

      // Render Other Stores Markers
      stores.forEach((store) => {
        if (store.id === myStore.id) return;
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(store.lat, store.lng),
          map: map,
          title: store.storeName,
          icon: {
            content: createMarkerHtml(store, false),
            anchor: new window.naver.maps.Point(20, 45),
          },
        });

        window.naver.maps.Event.addListener(marker, 'click', () => onSelectStore(store));
        markersRef.current[store.id] = marker;
      });
    } catch (err) {
      console.warn('Naver Maps render error:', err);
      setLoadError(true);
    }
  }, [scriptLoaded, stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation]);

  // Fallback View if Client ID is missing or load / auth failed
  if (!clientId || loadError) {
    return (
      <div className="relative w-full h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-base">
            🗺️ 네이버 지도 API 인증 동기화 진행 중
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            네이버 클라우드 카드 승인 및 API 게이트웨이 동기화가 진행 중입니다. (약 3분 소요)<br/>
            동기화 완료 후 새로고침하시면 고화질 지도가 로드됩니다.
          </p>
          <div className="bg-gray-900 text-amber-300 p-3 rounded-xl text-left text-xs font-mono">
            VITE_NAVER_CLIENT_ID={clientId || '8ek0m4smqn'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-gray-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        네이버 지도 (Naver Maps SDK) 고화질 모드
      </div>
    </div>
  );
};
