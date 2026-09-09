import React, { useRef } from 'react';
import { Bug, HelpCircle, Lightbulb, Handshake, Headphones } from 'lucide-react';
import { InquiryType } from '../types/trade';

interface FooterProps {
  onOpenInquiry: (type: InquiryType) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenWebmasterAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenInquiry,
  onOpenTerms,
  onOpenPrivacy,
  onOpenWebmasterAuth,
}) => {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleCopyrightClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenWebmasterAuth();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 800);
    }
  };

  return (
    <footer className="w-full bg-slate-50 border-t border-gray-200 text-gray-600 py-10 px-4 sm:px-6 relative z-10 font-sans">
      
      {/* 🎧 💌 원클릭 문의 및 오류, 제휴·광고 제안 Card */}
      <div className="max-w-4xl mx-auto bg-white border border-orange-200/80 rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
        <h4 className="text-gray-800 font-extrabold text-sm sm:text-base text-center mb-4 flex items-center justify-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs">
            <Headphones className="w-3.5 h-3.5" />
          </span>
          <span>소통 창구 · 원클릭 문의 및 제휴·광고 제안</span>
        </h4>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => onOpenInquiry('BUG')}
            className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <Bug className="w-3.5 h-3.5 text-rose-500" />
            <span>🪲 버그 & 오류 신고</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('INQUIRY')}
            className="px-4 py-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
            <span>❔ 문의사항 남기기</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('FEATURE')}
            className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>💡 기능 개선 제안</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('PARTNERSHIP')}
            className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <Handshake className="w-3.5 h-3.5 text-emerald-500" />
            <span>🤝 제휴·광고 제안</span>
          </button>
        </div>
      </div>

      {/* Navigation Links: 이용약관 | 개인정보처리방침 */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold mb-5">
        <button
          type="button"
          onClick={onOpenTerms}
          className="text-gray-600 hover:text-orange-600 transition-colors"
        >
          이용약관
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-orange-600 font-extrabold hover:text-orange-700 underline underline-offset-4 transition-colors"
        >
          개인정보처리방침
        </button>
      </div>

      {/* Company Details & Statutory Intermediary Disclaimer */}
      <div className="max-w-3xl mx-auto text-center space-y-2 text-xs text-gray-500 leading-relaxed font-sans">
        <p className="font-extrabold text-gray-800 text-xs sm:text-sm">
          TradeMe (트레이드미) <span className="text-gray-300 font-normal">|</span> 대한민국 소상공인 1:1 물물교환 & 상생 모바일 교환권 플랫폼
        </p>

        <p className="text-gray-600">
          상호명: TradeMe <span className="text-gray-300">|</span> 대표: 김동욱 <span className="text-gray-300">|</span> 사업장: 경남 양산시 북정서길 25 104호
        </p>

        <p className="text-gray-600">
          대표 이메일:{' '}
          <a href="mailto:hanmaner@naver.com" className="text-orange-600 hover:underline font-bold">
            hanmaner@naver.com
          </a>{' '}
          <span className="text-gray-300">|</span> 고객센터 운영시간: 24시간 실시간 온라인 접수 (영업일 기준 순차 처리)
        </p>

        <p className="text-[11px] text-gray-400 max-w-2xl mx-auto pt-1 leading-normal">
          [면책 고지] 트레이드미는 전자상거래 등에서의 소비자보호에 관한 법률 제20조 제2항에 따른 통신판매중개자로서 통신판매의 당사자가 아니며, 회원 간 물물교환 및 교환권 거래, 직거래 등에서 발생하는 일체의 분쟁 및 안전사고에 대한 책임은 당사자에게 있습니다.
        </p>
      </div>

      {/* Copyright with Triple-Click Easter Egg */}
      <div className="mt-8 pt-5 border-t border-gray-200 text-center">
        <p
          onClick={handleCopyrightClick}
          className="text-xs text-gray-400 select-none cursor-pointer hover:text-orange-600 transition-colors inline-block py-1 font-medium"
          title="최고 관리자 보안 인증"
        >
          Copyright © 2026 <strong className="text-gray-600 font-bold hover:text-orange-600">TradeMe</strong>. All rights reserved.
        </p>
      </div>

    </footer>
  );
};
