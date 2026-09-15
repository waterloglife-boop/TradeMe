import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Store } from '../types/trade';
import { Utensils, Bed, Coffee, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';

interface MapViewProps {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  myStore: Store;
  onMapClickPinLocation?: (lat: number, lng: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  stores,
  selectedStore,
  onSelectStore,
  myStore,
  onMapClickPinLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tempPickerMarkerRef = useRef<L.Marker | null>(null);

  const [pinStyle, setPinStyle] = useState<'PILL' | 'MICRO'>('PILL');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [37.5665, 126.9780], // 대한민국 표준 서울 중심 좌표
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Handle map click for location picking
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (tempPickerMarkerRef.current) {
          tempPickerMarkerRef.current.remove();
        }

        const tempIcon = L.divIcon({
          html: `<div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold animate-bounce">📍</div>`,
          className: 'custom-map-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        tempPickerMarkerRef.current = L.marker([lat, lng], { icon: tempIcon }).addTo(map);

        if (onMapClickPinLocation) {
          onMapClickPinLocation(lat, lng);
        }
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous store markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const createCustomIcon = (store: Store, isMyStore: boolean) => {
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

      // 테두리 강조 (말풍선 일체 제거)
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

      if (pinStyle === 'MICRO') {
        const html = `
          <div 
            data-store-id="${store.id}"
            onclick="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
            ontouchend="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
            style="transform: translate(-50%, -50%) ${isSelected ? 'scale(1.25)' : 'scale(1)'}; cursor: pointer;"
            class="transition-transform select-none"
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
        return L.divIcon({
          html,
          className: 'custom-map-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
      }

      const html = `
        <div 
          data-store-id="${store.id}"
          onclick="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
          ontouchend="window.__onSelectStoreFromMap && window.__onSelectStoreFromMap('${store.id}')"
          style="transform: translate(-50%, -100%) ${isSelected ? 'scale(1.15)' : 'scale(1)'}; cursor: pointer;"
          class="transition-transform select-none flex flex-col items-center"
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

      return L.divIcon({
        html,
        className: 'custom-map-pin',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    };

    // Add My Store Marker (필터 결과에 포함된 경우에만 노출)
    const isMyStoreInFiltered = stores.some((s) => s.id === myStore?.id);
    if (isMyStoreInFiltered && myStore?.lat && myStore?.lng) {
      const myIcon = createCustomIcon(myStore, true);
      const myMarker = L.marker([myStore.lat, myStore.lng], { icon: myIcon })
        .addTo(map)
        .on('click', () => onSelectStore(myStore));
      markersRef.current[myStore.id] = myMarker;
    }

    // Add Other Stores Markers
    stores.forEach((store) => {
      if (store.id === myStore.id) return;
      const icon = createCustomIcon(store, false);
      const marker = L.marker([store.lat, store.lng], { icon })
        .addTo(map)
        .on('click', () => onSelectStore(store));

      markersRef.current[store.id] = marker;
    });

  }, [stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation, pinStyle]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
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
        >
          <span>📍</span>
          <span>초소형 핀</span>
        </button>
      </div>
    </div>
  );
};
