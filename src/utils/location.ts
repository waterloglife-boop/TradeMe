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
