import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface OperatingHoursPickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  subLabel?: string;
}

// 30분 단위 표준 시간 목록 생성 (06:00 ~ 24:00)
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 24; h++) {
  const hourStr = h < 10 ? `0${h}` : `${h}`;
  TIME_OPTIONS.push(`${hourStr}:00`);
  if (h < 24) {
    TIME_OPTIONS.push(`${hourStr}:30`);
  }
}

// 마감 시간 전용 (심야/익일 새벽 시간대 지원: 주점, 펍, 야식 등)
const CLOSING_TIME_OPTIONS: string[] = [
  ...TIME_OPTIONS,
  '익일 01:00',
  '익일 01:30',
  '익일 02:00',
  '익일 02:30',
  '익일 03:00',
  '익일 04:00',
  '익일 05:00',
  '익일 06:00',
];

const HOLIDAY_OPTIONS = [
  { label: '연중무휴 / 매일 영업', value: '' },
  { label: '연중무휴 표기', value: '연중무휴' },
  { label: '매주 일요일 휴무', value: '매주 일요일 휴무' },
  { label: '매주 월요일 휴무', value: '매주 월요일 휴무' },
  { label: '매주 화요일 휴무', value: '매주 화요일 휴무' },
  { label: '매주 수요일 휴무', value: '매주 수요일 휴무' },
  { label: '매주 목요일 휴무', value: '매주 목요일 휴무' },
  { label: '매주 금요일 휴무', value: '매주 금요일 휴무' },
  { label: '매주 토요일 휴무', value: '매주 토요일 휴무' },
  { label: '주말(토·일) 휴무', value: '주말 휴무' },
];

const PRESETS = [
  { label: '식당·외식 (11:00 - 23:00)', start: '11:00', end: '23:00', note: '' },
  { label: '카페·디저트 (10:00 - 22:00)', start: '10:00', end: '22:00', note: '' },
  { label: '주점·펍 (17:00 - 익일 01:00)', start: '17:00', end: '익일 01:00', note: '' },
  { label: '뷰티·미용 (10:00 - 20:00)', start: '10:00', end: '20:00', note: '' },
  { label: '24시간 영업', start: '00:00', end: '24:00', note: '24시간 영업' },
];

/**
 * 기존 임의 문자열에서 시작/마감/휴무 정보 파싱
 */
function parseOperatingHours(raw: string) {
  if (!raw || !raw.trim()) {
    return { start: '10:00', end: '22:00', note: '' };
  }

  const str = raw.trim();

  // 24시간 영업 체크
  if (str.includes('24시간')) {
    return { start: '00:00', end: '24:00', note: '24시간 영업' };
  }

  // 괄호 속 휴무일 메모 추출
  let note = '';
  const noteMatch = str.match(/\((.*?)\)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
  }

  let start = '10:00';
  let end = '22:00';

  if (str.includes('익일')) {
    // 시작 시간 추출
    const sMatch = str.match(/(\d{1,2}):?(\d{2})?.*?(?:익일|익일\s*(\d{1,2}):?(\d{2})?)/);
    if (sMatch) {
      const sH = parseInt(sMatch[1], 10);
      const sM = sMatch[2] || '00';
      start = `${sH < 10 ? '0' + sH : sH}:${sM}`;
    }
    const eMatch = str.match(/익일\s*(\d{1,2}):?(\d{2})?/);
    if (eMatch) {
      const eH = parseInt(eMatch[1], 10);
      const eM = eMatch[2] || '00';
      end = `익일 ${eH < 10 ? '0' + eH : eH}:${eM}`;
    }
  } else {
    // 일반 시간 (예: "11:00 - 23:00" 또는 "11:00 ~ 23:00")
    const times = str.match(/(\d{1,2}):(\d{2})/g);
    if (times && times.length >= 2) {
      start = times[0].length === 4 ? `0${times[0]}` : times[0];
      end = times[1].length === 4 ? `0${times[1]}` : times[1];
    } else {
      // 한국어 표기 (예: "11시 - 23시" 또는 "11시~23시")
      const krHours = str.match(/(\d{1,2})시/g);
      if (krHours && krHours.length >= 2) {
        const h1 = parseInt(krHours[0], 10);
        const h2 = parseInt(krHours[1], 10);
        start = `${h1 < 10 ? '0' + h1 : h1}:00`;
        end = `${h2 < 10 ? '0' + h2 : h2}:00`;
      }
    }
  }

  return { start, end, note };
}

export const OperatingHoursPicker: React.FC<OperatingHoursPickerProps> = ({
  value,
  onChange,
  label = '매장 영업시간 (교환 가능 시간)',
  subLabel = '이웃 사장님들이 물물교환 또는 픽업 가능한 표준 시간대',
}) => {
  const parsed = useMemo(() => parseOperatingHours(value), [value]);

  const [startTime, setStartTime] = useState(parsed.start);
  const [endTime, setEndTime] = useState(parsed.end);
  const [holidayNote, setHolidayNote] = useState(parsed.note);

  // 동기화
  useEffect(() => {
    setStartTime(parsed.start);
    setEndTime(parsed.end);
    setHolidayNote(parsed.note);
  }, [parsed]);

  const updateFormattedValue = (s: string, e: string, n: string) => {
    let formatted = '';
    if (n === '24시간 영업' || (s === '00:00' && e === '24:00')) {
      formatted = '00:00 - 24:00 (24시간 영업)';
    } else {
      formatted = `${s} - ${e}${n ? ` (${n})` : ''}`;
    }
    onChange(formatted);
  };

  const handleStartChange = (newStart: string) => {
    setStartTime(newStart);
    updateFormattedValue(newStart, endTime, holidayNote);
  };

  const handleEndChange = (newEnd: string) => {
    setEndTime(newEnd);
    updateFormattedValue(startTime, newEnd, holidayNote);
  };

  const handleHolidayChange = (newNote: string) => {
    setHolidayNote(newNote);
    updateFormattedValue(startTime, endTime, newNote);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    setHolidayNote(preset.note);
    updateFormattedValue(preset.start, preset.end, preset.note);
  };

  // 현재 완성된 표준 표기
  const currentFormatted = useMemo(() => {
    if (holidayNote === '24시간 영업' || (startTime === '00:00' && endTime === '24:00')) {
      return '00:00 - 24:00 (24시간 영업)';
    }
    return `${startTime} - ${endTime}${holidayNote ? ` (${holidayNote})` : ''}`;
  }, [startTime, endTime, holidayNote]);

  return (
    <div className="space-y-2.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/90 shadow-2xs">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
          표준 규격 자동적용
        </span>
      </div>
      {subLabel && (
        <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
          💡 {subLabel}
        </p>
      )}

      {/* 빠른 업종별 프리셋 버튼 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>추천:</span>
        </span>
        {PRESETS.map((preset) => {
          const isActive =
            startTime === preset.start &&
            endTime === preset.end &&
            holidayNote === preset.note;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs scale-[1.02]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50/50'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* 시간 선택 드롭다운 (시작 ~ 마감) */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <span className="block text-[11px] font-extrabold text-gray-700 mb-1 flex items-center gap-1">
            <span>☀️</span> 오픈 (시작) 시간
          </span>
          <select
            value={startTime}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-[11px] font-extrabold text-gray-700 mb-1 flex items-center gap-1">
            <span>🌙</span> 마감 (종료) 시간
          </span>
          <select
            value={endTime}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
          >
            {CLOSING_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 정기휴무일 / 옵션 선택 */}
      <div className="pt-1">
        <span className="block text-[11px] font-extrabold text-gray-700 mb-1 flex items-center gap-1">
          <span>🗓️</span> 정기 휴무일 (선택)
        </span>
        <select
          value={holidayNote}
          onChange={(e) => handleHolidayChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
        >
          {HOLIDAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 실시간 적용 결과 배너 */}
      <div className="mt-2 p-3 bg-white rounded-xl border border-amber-300 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-[11px] text-gray-500 font-medium">설정된 영업시간:</span>
          <strong className="text-gray-900 font-extrabold text-sm">{currentFormatted}</strong>
        </div>
        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          ✓ 표준 규격 적용
        </span>
      </div>
    </div>
  );
};
