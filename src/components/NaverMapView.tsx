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
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoding`;
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

  // 2. Initialize Pure Naver Map Instance & Custom Store Pins
  useEffect(() => {
    if (!scriptLoaded || !window.naver || !window.naver.maps || !mapContainerRef.current) {
      return;
    }

    try {
      if (!naverMapInstanceRef.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(35.3605, 129.0468), // 경남 양산시 북정서길 25 (마라위크 / 북정초 인근)
          zoom: 15,
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
        map,
        title: myStore.storeName,
        icon: { content: createMarkerHtml(myStore, true), anchor: new window.naver.maps.Point(20, 45) },
      });
      window.naver.maps.Event.addListener(myMarker, 'click', () => onSelectStore(myStore));
      markersRef.current[myStore.id] = myMarker;

      // Render Other Stores Markers
      stores.forEach((store) => {
        if (store.id === myStore.id) return;
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(store.lat, store.lng),
          map,
          title: store.storeName,
          icon: { content: createMarkerHtml(store, false), anchor: new window.naver.maps.Point(20, 45) },
        });
        window.naver.maps.Event.addListener(marker, 'click', () => onSelectStore(store));
        markersRef.current[store.id] = marker;
      });
    } catch (err) {
      console.error('Naver Maps render notice:', err);
    }
  }, [scriptLoaded, stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation]);

  // 2. [상태 동기화 및 핀 이동 로직 구현] Naver Geocoding 좌표 변경 시 지도 핀 및 중심점 자동 이동
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
      <div className="relative w-full h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
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
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
