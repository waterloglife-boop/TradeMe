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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [35.1788, 129.1995],
        zoom: 15,
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
      const isBreakTime = store.breakTimeActive;
      const isSelected = selectedStore?.id === store.id;

      let bgColor = 'bg-slate-800';
      let borderColor = 'border-slate-600';
      let iconEmoji = '🍽️';

      if (store.category === 'ACCOMMODATION') iconEmoji = '🏨';
      if (store.category === 'JAPANESE') iconEmoji = '🍣';
      if (store.category === 'WESTERN') iconEmoji = '🍝';
      if (store.category === 'CAFE') iconEmoji = '☕';
      if (isMyStore) iconEmoji = '👑';

      if (isBreakTime) {
        bgColor = 'bg-gradient-to-tr from-amber-500 to-orange-500';
        borderColor = 'border-amber-200 ring-4 ring-amber-400/40 animate-pulse';
      }

      if (isMyStore) {
        bgColor = 'bg-gradient-to-tr from-blue-600 to-indigo-600';
        borderColor = 'border-blue-200 ring-2 ring-blue-400/50';
      }

      const html = `
        <div class="relative group cursor-pointer transition-transform transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          ${
            isBreakTime
              ? `<div class="absolute -top-6 -left-4 bg-amber-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-lg border border-amber-300 flex items-center gap-0.5 whitespace-nowrap animate-bounce">
                  <span>☕ 교환 가능</span>
                 </div>`
              : ''
          }
          <div class="w-10 h-10 rounded-full ${bgColor} ${borderColor} shadow-xl flex items-center justify-center text-lg text-white border-2">
            ${iconEmoji}
          </div>
          <div class="mt-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md shadow-md border border-gray-200 text-[11px] font-bold text-gray-800 text-center truncate max-w-[100px]">
            ${store.storeName}
          </div>
        </div>
      `;

      return L.divIcon({
        html,
        className: 'custom-map-pin',
        iconSize: [40, 55],
        iconAnchor: [20, 50],
      });
    };

    // Add My Store Marker
    const myIcon = createCustomIcon(myStore, true);
    const myMarker = L.marker([myStore.lat, myStore.lng], { icon: myIcon })
      .addTo(map)
      .on('click', () => onSelectStore(myStore));
    markersRef.current[myStore.id] = myMarker;

    // Add Other Stores Markers
    stores.forEach((store) => {
      if (store.id === myStore.id) return;
      const icon = createCustomIcon(store, false);
      const marker = L.marker([store.lat, store.lng], { icon })
        .addTo(map)
        .on('click', () => onSelectStore(store));

      markersRef.current[store.id] = marker;
    });

  }, [stores, selectedStore, myStore, onSelectStore, onMapClickPinLocation]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-xl shadow-lg border border-gray-200/80 text-xs flex flex-col gap-1.5">
        <div className="font-bold text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-100">
          <MapPin className="w-3.5 h-3.5 text-orange-500" />
          지도 범례 (송정해수욕장 부근)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-pulse inline-block"></span>
          <span className="font-semibold text-amber-900">브레이크 타임 (교환가능)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-800 inline-block"></span>
          <span className="text-gray-600">영업 중 매장</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
          <span className="font-bold text-blue-700">👑 우리 가게 (내 매장)</span>
        </div>
      </div>
    </div>
  );
};
