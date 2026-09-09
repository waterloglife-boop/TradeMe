/**
 * Location & Neighborhood Utilities
 * - Haversine distance calculation
 * - Travel time estimation
 * - Korean address parsing for local neighborhood branding
 */

export interface NeighborhoodInfo {
  shortDong: string; // e.g. "북정동", "우동", "역삼동", "우리 동네"
  cityOrDistrict: string; // e.g. "양산시", "해운대구", "강남구"
  fullRegion: string; // e.g. "양산 북정동 & 인근 상권"
  anonStore: string; // e.g. "북정동 이웃 매장"
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  // Exact same point
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Returns a human-friendly travel time string based on distance.
 */
export function getTravelTimeEstimate(distanceKm: number): string {
  if (distanceKm <= 0.05) {
    return '내 매장';
  }
  if (distanceKm <= 0.5) {
    return `도보 ${Math.max(1, Math.round(distanceKm * 12))}분`;
  }
  if (distanceKm <= 1.5) {
    const walkMin = Math.round(distanceKm * 12);
    return `도보 ${walkMin}분 · 차량 3분`;
  }
  if (distanceKm <= 3.0) {
    return `차량 ${Math.round(distanceKm * 2.2 + 2)}분`;
  }
  if (distanceKm <= 10.0) {
    return `차량 ${Math.round(distanceKm * 2.2 + 3)}분`;
  }
  return `차량 ${Math.round(distanceKm * 2.0)}분 이상`;
}

/**
 * Parses Korean street or land-lot addresses to extract concise local neighborhood names.
 * Fallback to '우리 동네' when input is missing or unparseable.
 */
export function parseNeighborhoodInfo(address?: string): NeighborhoodInfo {
  const fallback: NeighborhoodInfo = {
    shortDong: '우리 동네',
    cityOrDistrict: '로컬',
    fullRegion: '우리 동네 & 인근 상권',
    anonStore: '이웃 매장',
  };

  if (!address || !address.trim()) {
    return fallback;
  }

  const cleanAddr = address.trim();

  // 1. Check if there is an explicit (dong) in parenthesis, e.g. "서울특별시 중구 세종대로 110 (태평로1가)"
  const parenthesisMatch = cleanAddr.match(/\(([가-힣0-9]+(?:동|읍|면|가|리))\)/);
  let detectedDong = parenthesisMatch ? parenthesisMatch[1] : '';

  // 2. Tokenize by whitespace
  const tokens = cleanAddr.split(/\s+/);

  let cityOrDistrict = '';
  let streetOrDong = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // Match City or District (e.g. 강남구, 해운대구, 수원시, 서귀포시)
    if (!cityOrDistrict && /[가-힣]+(?:시|구|군)$/.test(token)) {
      cityOrDistrict = token;
      continue;
    }
    // Match Dong / Eup / Myeon / Ga / Ri
    if (!detectedDong && /[가-힣0-9]+(?:동|읍|면|가|리)$/.test(token)) {
      detectedDong = token;
      continue;
    }
    // Match Road / Street names (e.g. 세종대로, 테헤란로, 전포대로)
    if (!streetOrDong && /[가-힣0-9]+(?:로|길)$/.test(token)) {
      streetOrDong = token;
      continue;
    }
    // Match bare city/district name at beginning (e.g. "서울 세종대로 110" -> city: "서울")
    if (!cityOrDistrict && i <= 1 && token.length >= 2 && !/[0-9]/.test(token) && !['도', '시', '구', '군'].includes(token)) {
      if (!['경남', '경북', '전남', '전북', '충남', '충북', '강원', '경기'].includes(token)) {
        cityOrDistrict = token;
      }
    }
  }

  // If no explicit Dong found, try to derive from road name (e.g. '테헤란로' -> '역삼동', '전포대로' -> '전포동')
  if (!detectedDong && streetOrDong) {
    const roadBaseMatch = streetOrDong.match(/^([가-힣]{2,}?)(?:동길|서길|남길|북길|중앙길|안길|길|로\d*길|대로|로)$/);
    if (roadBaseMatch) {
      detectedDong = `${roadBaseMatch[1]}동`;
    } else {
      detectedDong = streetOrDong;
    }
  }

  const finalDong = detectedDong || streetOrDong || '우리 동네';
  const simplifiedCity = cityOrDistrict ? cityOrDistrict.replace(/(?:시|특별시|광역시|특별자치시)$/, '') : '';

  let fullRegion = '';
  if (simplifiedCity && finalDong && finalDong !== '우리 동네') {
    fullRegion = `${simplifiedCity} ${finalDong} & 인근 상권`;
  } else if (finalDong && finalDong !== '우리 동네') {
    fullRegion = `${finalDong} & 인근 상권`;
  } else {
    fullRegion = '우리 동네 & 인근 상권';
  }

  const anonStore = finalDong && finalDong !== '우리 동네'
    ? `${finalDong} 이웃 매장`
    : '이웃 매장';

  return {
    shortDong: finalDong,
    cityOrDistrict: cityOrDistrict || '로컬',
    fullRegion,
    anonStore,
  };
}

/**
 * 🗺️ Korean Administrative Regions Coordinate Dictionary (Fallback for Offline / Failed Geocoding)
 */
export const KOREAN_REGION_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  // 서울
  '서울': { lat: 37.5665, lng: 126.9780 },
  '종로구': { lat: 37.5730, lng: 126.9794 },
  '중구': { lat: 37.5637, lng: 126.9975 },
  '용산구': { lat: 37.5326, lng: 126.9900 },
  '성동구': { lat: 37.5634, lng: 127.0368 },
  '광진구': { lat: 37.5385, lng: 127.0823 },
  '동대문구': { lat: 37.5744, lng: 127.0398 },
  '중랑구': { lat: 37.6063, lng: 127.0928 },
  '성북구': { lat: 37.5894, lng: 127.0167 },
  '강북구': { lat: 37.6397, lng: 127.0255 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '노원구': { lat: 37.6543, lng: 127.0564 },
  '은평구': { lat: 37.6027, lng: 126.9291 },
  '서대문구': { lat: 37.5791, lng: 126.9368 },
  '마포구': { lat: 37.5663, lng: 126.9016 },
  '양천구': { lat: 37.5170, lng: 126.8665 },
  '강서구': { lat: 37.5509, lng: 126.8495 },
  '구로구': { lat: 37.4954, lng: 126.8875 },
  '금천구': { lat: 37.4569, lng: 126.8954 },
  '영등포구': { lat: 37.5264, lng: 126.8962 },
  '동작구': { lat: 37.5124, lng: 126.9393 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '송파구': { lat: 37.5145, lng: 127.1066 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  // 부산
  '부산': { lat: 35.1796, lng: 129.0756 },
  '해운대구': { lat: 35.1631, lng: 129.1636 },
  '수영구': { lat: 35.1456, lng: 129.1131 },
  '부산진구': { lat: 35.1631, lng: 129.0532 },
  '동래구': { lat: 35.2048, lng: 129.0838 },
  '남구': { lat: 35.1365, lng: 129.0842 },
  '북구': { lat: 35.1970, lng: 128.9904 },
  '사상구': { lat: 35.1527, lng: 128.9913 },
  '사하구': { lat: 35.1044, lng: 128.9749 },
  '금정구': { lat: 35.2429, lng: 129.0924 },
  '연제구': { lat: 35.1764, lng: 129.0797 },
  '기장군': { lat: 35.2447, lng: 129.2223 },
  // 대구
  '대구': { lat: 35.8714, lng: 128.6014 },
  '수성구': { lat: 35.8583, lng: 128.6306 },
  '달서구': { lat: 35.8299, lng: 128.5327 },
  // 인천
  '인천': { lat: 37.4563, lng: 126.7052 },
  '부평구': { lat: 37.5074, lng: 126.7219 },
  '연수구': { lat: 37.4101, lng: 126.6783 },
  '남동구': { lat: 37.4470, lng: 126.7314 },
  // 광주
  '광주': { lat: 35.1595, lng: 126.8526 },
  // 대전
  '대전': { lat: 36.3504, lng: 127.3845 },
  '유성구': { lat: 36.3622, lng: 127.3563 },
  // 울산
  '울산': { lat: 35.5384, lng: 129.3114 },
  // 세종
  '세종': { lat: 36.4800, lng: 127.2890 },
  // 경기
  '수원시': { lat: 37.2636, lng: 127.0286 },
  '성남시': { lat: 37.4200, lng: 127.1265 },
  '분당구': { lat: 37.3827, lng: 127.1189 },
  '고양시': { lat: 37.6584, lng: 126.8320 },
  '용인시': { lat: 37.2411, lng: 127.1776 },
  '부천시': { lat: 37.5034, lng: 126.7660 },
  '안산시': { lat: 37.3219, lng: 126.8309 },
  '안양시': { lat: 37.3943, lng: 126.9568 },
  '화성시': { lat: 37.1995, lng: 126.8315 },
  '평택시': { lat: 36.9921, lng: 127.1129 },
  // 경남
  '창원시': { lat: 35.2280, lng: 128.6811 },
  '양산시': { lat: 35.3350, lng: 129.0373 },
  '김해시': { lat: 35.2285, lng: 128.8894 },
  '진주시': { lat: 35.1802, lng: 128.1076 },
  // 경북
  '포항시': { lat: 36.0190, lng: 129.3435 },
  '구미시': { lat: 36.1195, lng: 128.3446 },
  // 충청 / 전라 / 강원 / 제주
  '천안시': { lat: 36.8151, lng: 127.1139 },
  '청주시': { lat: 36.6424, lng: 127.4890 },
  '전주시': { lat: 35.8242, lng: 127.1480 },
  '순천시': { lat: 34.9507, lng: 127.4872 },
  '여수시': { lat: 34.7604, lng: 127.6622 },
  '춘천시': { lat: 37.8813, lng: 127.7298 },
  '원주시': { lat: 37.3422, lng: 127.9202 },
  '강릉시': { lat: 37.7519, lng: 128.8761 },
  '제주': { lat: 33.4996, lng: 126.5312 },
  '서귀포시': { lat: 33.2541, lng: 126.5601 },
};

const NAVER_CLIENT_ID = '8ek0m4smqn';

/**
 * Ensures Naver Maps SDK with geocoder submodule is loaded into window
 */
export function ensureNaverMapsSdkLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).naver?.maps?.Service?.geocode) return Promise.resolve(true);

  return new Promise((resolve) => {
    const scriptId = 'naver-map-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const checkReady = () => !!(window as any).naver?.maps?.Service?.geocode;
    if (checkReady()) return resolve(true);

    let resolved = false;
    const finish = (val: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // Fast 800ms fallback to avoid delaying Nominatim & Region dictionary
    const timeout = setTimeout(() => finish(checkReady()), 800);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}&submodules=geocoder`;
      script.async = true;
      script.onload = () => {
        const interval = setInterval(() => {
          if (checkReady()) {
            clearInterval(interval);
            clearTimeout(timeout);
            finish(true);
          }
        }, 50);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        finish(false);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (checkReady()) {
          clearInterval(interval);
          clearTimeout(timeout);
          finish(true);
        }
      }, 50);
    }
  });
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
  source: 'naver' | 'nominatim' | 'region_dict' | 'default';
}

/**
 * 📍 지능형 한국 주소 지오코딩 서비스 (Geocoding)
 * 1. 호수/층수/상세주소 자동 정제
 * 2. 네이버 지도 SDK Geocoder 실시간 호출
 * 3. OpenStreetMap Nominatim 2차 폴백
 * 4. 한국 17개 시/도 및 주요 구/시/군 좌표 사전 3차 폴백
 */
export async function geocodeKoreanAddress(rawAddress: string): Promise<GeocodeResult | null> {
  if (!rawAddress || !rawAddress.trim()) return null;

  const original = rawAddress.trim();
  // 도로명/지번 뒤에 붙은 숫자 분리 (예: '북정서길25' -> '북정서길 25', '테헤란로152' -> '테헤란로 152')
  const spacedAddr = original.replace(/([로길동읍면가])(\d+)/g, '$1 $2');
  // 호수, 층수, 괄호 등 세부 정보 제거 (네이버/외부 지오코더는 층/호수가 포함되면 매칭 실패)
  const cleanAddr = spacedAddr
    .replace(/\s*\d+호|\s*\d+층|\s*지하\s*\d+층|\s*\(.*?\)/g, '')
    .trim() || spacedAddr;

  // 1. 네이버 지도 SDK 지오코더 시도
  try {
    const naverReady = await ensureNaverMapsSdkLoaded();
    if (naverReady && (window as any).naver?.maps?.Service?.geocode) {
      const naverRes = await new Promise<GeocodeResult | null>((resolve) => {
        (window as any).naver.maps.Service.geocode(
          { query: cleanAddr },
          (status: any, response: any) => {
            if (
              status === (window as any).naver.maps.Service.Status.OK &&
              response?.v2?.addresses?.length > 0
            ) {
              const item = response.v2.addresses[0];
              const lat = parseFloat(item.y);
              const lng = parseFloat(item.x);
              if (!isNaN(lat) && !isNaN(lng)) {
                return resolve({
                  lat,
                  lng,
                  formattedAddress: item.roadAddress || item.jibunAddress || cleanAddr,
                  source: 'naver',
                });
              }
            }

            // 정제된 주소로 실패 시 원본 주소로 1회 추가 시도
            if (cleanAddr !== original) {
              (window as any).naver.maps.Service.geocode(
                { query: original },
                (status2: any, response2: any) => {
                  if (
                    status2 === (window as any).naver.maps.Service.Status.OK &&
                    response2?.v2?.addresses?.length > 0
                  ) {
                    const item2 = response2.v2.addresses[0];
                    const lat2 = parseFloat(item2.y);
                    const lng2 = parseFloat(item2.x);
                    if (!isNaN(lat2) && !isNaN(lng2)) {
                      return resolve({
                        lat: lat2,
                        lng: lng2,
                        formattedAddress: item2.roadAddress || item2.jibunAddress || original,
                        source: 'naver',
                      });
                    }
                  }
                  resolve(null);
                }
              );
            } else {
              resolve(null);
            }
          }
        );
      });

      if (naverRes) return naverRes;
    }
  } catch (err) {
    console.warn('[Geocoding] Naver SDK lookup notice:', err);
  }

  // 2. OpenStreetMap Nominatim 폴백 (네트워크 호출)
  const nominatimQueries = [
    cleanAddr,
    spacedAddr,
    cleanAddr.replace(/\s+\d+(-\d+)?$/, '').trim(),
    original,
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  for (const q of nominatimQueries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=kr&limit=1`,
        { headers: { 'Accept-Language': 'ko,en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              lat,
              lng,
              formattedAddress: data[0].display_name,
              source: 'nominatim',
            };
          }
        }
      }
    } catch (e) {
      // Nominatim failed, proceed
    }
  }

  // 3. 한국 주요 행정구역 좌표 사전 매칭 (오프라인 / API 호출 한도 초과 시)
  for (const [regionName, coords] of Object.entries(KOREAN_REGION_COORDINATES)) {
    if (original.includes(regionName)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        formattedAddress: regionName,
        source: 'region_dict',
      };
    }
  }

  // 기본값 (서울 시청)
  return {
    lat: 37.5665,
    lng: 126.9780,
    formattedAddress: '대한민국',
    source: 'default',
  };
}
