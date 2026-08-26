import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Store } from '../types/trade';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

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
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const tempPickerMarkerRef = useRef<any>(null);
  
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [useFallbackLeaflet, setUseFallbackLeaflet] = useState<boolean>(false);

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID || '8ek0m4smqn';

  // 1. Inject Naver Map Script Async
  useEffect(() => {
    if (!clientId) {
      setUseFallbackLeaflet(true);
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
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.warn('Naver Maps script load error, switching to seamless Leaflet fallback.');
      setUseFallbackLeaflet(true);
    };

    document.head.appendChild(script);
  }, [clientId]);

  // 2. Initialize Naver Map OR Seamless Leaflet Fallback
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // A. Try Naver Map if script loaded and no error
    if (scriptLoaded && window.naver && window.naver.maps && !useFallbackLeaflet) {
      // Catch authentication fault
      if (window.naver.maps.onJSAPIFault) {
        window.naver.maps.onJSAPIFault = () => {
          console.warn('Naver API key syncing, switching to Leaflet fallback.');
          setUseFallbackLeaflet(true);
        };
      }

      try {
        if (!naverMapInstanceRef.current) {
          const mapOptions = {
            center: new window.naver.maps.LatLng(35.1788, 129.1995),
            zoom: 15,
            zoomControl: true,
            zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
          };
          naverMapInstanceRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

          if (onMapClickPinLocation) {
            window.naver.maps.Event.addListener(naverMapInstanceRef.current, 'click', (e: any) => {
              onMapClickPinLocation(e.coord.lat(), e.coord.lng());
            });
          }
        }

        const map = naverMapInstanceRef.current;
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

        const myMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(myStore.lat, myStore.lng),
          map,
          title: myStore.storeName,
          icon: { content: createMarkerHtml(myStore, true), anchor: new window.naver.maps.Point(20, 45) },
        });
        window.naver.maps.Event.addListener(myMarker, 'click', () => onSelectStore(myStore));
        markersRef.current[myStore.id] = myMarker;

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

        return;
      } catch (err) {
        setUseFallbackLeaflet(true);
      }
    }

    // B. Leaflet Map Fallback (Runs if Naver Map API is not ready or failed)
    if (!leafletMapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [35.1788, 129.1995],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickPinLocation) {
          onMapClickPinLocation(e.latlng.lat, e.latlng.lng);
        }
      });

      leafletMapInstanceRef.current = map;
    }

    const map = leafletMapInstanceRef.current;
    Object.values(markersRef.current).forEach((m) => m.remove && m.remove());
    markersRef.current = {};

    const createLeafletIcon = (store: Store, isMyStore: boolean) => {
      const isBreakTime = store.breakTimeActive;
      const isSelected = selectedStore?.id === store.id;
      let bgColor = 'bg-slate-800';
      let iconEmoji = '🍽️';

      if (store.category === 'ACCOMMODATION') iconEmoji = '🏨';
      if (store.category === 'JAPANESE') iconEmoji = '🍣';
      if (store.category === 'WESTERN') iconEmoji = '🍝';
      if (store.category === 'CAFE') iconEmoji = '☕';
      if (isMyStore) iconEmoji = '👑';

      if (isBreakTime) bgColor = 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-4 ring-amber-400/40 animate-pulse';
      if (isMyStore) bgColor = 'bg-gradient-to-tr from-blue-600 to-indigo-600';

      const html = `
        <div class="relative group cursor-pointer ${isSelected ? 'scale-125 z-50' : ''}">
          ${isBreakTime ? `<div class="absolute -top-6 -left-4 bg-amber-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-amber-300">☕ 교환 가능</div>` : ''}
          <div class="w-10 h-10 rounded-full ${bgColor} border-2 border-white shadow-xl flex items-center justify-center text-lg text-white">
            ${iconEmoji}
          </div>
          <div class="mt-1 bg-white/95 px-2 py-0.5 rounded-md shadow border border-gray-200 text-[11px] font-bold text-gray-800 text-center truncate max-w-[100px]">
            ${store.storeName}
          </div>
        </div>
      `;

      return L.divIcon({ html, className: 'custom-map-pin', iconSize: [40, 55], iconAnchor: [20, 50] });
    };

    const myIcon = createLeafletIcon(myStore, true);
    const myMarker = L.marker([myStore.lat, myStore.lng], { icon: myIcon }).addTo(map).on('click', () => onSelectStore(myStore));
    markersRef.current[myStore.id] = myMarker;

    stores.forEach((store) => {
      if (store.id === myStore.id) return;
      const icon = createLeafletIcon(store, false);
      const marker = L.marker([store.lat, store.lng], { icon }).addTo(map).on('click', () => onSelectStore(store));
      markersRef.current[store.id] = marker;
    });

  }, [scriptLoaded, useFallbackLeaflet, stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Top Status Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl shadow-lg border border-gray-200 text-xs font-bold flex items-center gap-2">
        {!useFallbackLeaflet ? (
          <>
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-900">네이버 지도 (Naver Maps SDK) 고화질 모드</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="text-gray-800">인터랙티브 지도 (Naver API 키 동기화 대기 중)</span>
          </>
        )}
      </div>
    </div>
  );
};
