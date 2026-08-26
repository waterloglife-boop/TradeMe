import React, { useEffect, useRef } from 'react';
import { Store } from '../types/trade';

interface NaverMapViewProps {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  myStore: Store;
  naverClientId?: string;
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
  naverClientId,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // If window.naver is loaded
    if (window.naver && window.naver.maps && mapRef.current) {
      if (!naverMapInstanceRef.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(35.1788, 129.1995),
          zoom: 15,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
        };
        naverMapInstanceRef.current = new window.naver.maps.Map(mapRef.current, mapOptions);
      }

      const map = naverMapInstanceRef.current;

      // Render custom store markers
      stores.forEach((store) => {
        const isMyStore = store.id === myStore.id;
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(store.lat, store.lng),
          map: map,
          title: store.storeName,
          icon: {
            content: `
              <div style="background: ${
                store.breakTimeActive ? '#f59e0b' : isMyStore ? '#2563eb' : '#1e293b'
              }; color: white; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 2px solid white; cursor: pointer;">
                ${store.breakTimeActive ? '☕ ' : ''}${store.storeName}
              </div>
            `,
            anchor: new window.naver.maps.Point(40, 20),
          },
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          onSelectStore(store);
        });
      });
    }
  }, [stores, selectedStore, myStore, onSelectStore]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Naver SDK Guide Overlay if client ID is pending */}
      {!window.naver && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border text-xs max-w-xs">
          <p className="font-bold text-gray-800">🗺️ 네이버 지도 SDK 연동 모드</p>
          <p className="text-gray-600 mt-1">
            네이버 클라우드 플랫폼에서 발급받은 `NCP Client ID`를 입력하면 네이버 고화질 지도로 즉시 자동 전환됩니다.
          </p>
        </div>
      )}
    </div>
  );
};
