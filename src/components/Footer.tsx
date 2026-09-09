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
    <footer className="w-full bg-[#060B19] border-t border-cyan-900/30 text-gray-400 py-12 px-4 sm:px-6 relative z-10 font-sans">
      
      {/* 🎧 💌 원클릭 문의 및 오류, 제휴·광고 제안 Card */}
      <div className="max-w-4xl mx-auto bg-[#0B132B]/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 mb-8 shadow-[0_0_30px_rgba(6,182,212,0.12)]">
        <h4 className="text-cyan-400 font-extrabold text-sm sm:text-base text-center mb-4 flex items-center justify-center gap-2">
          <span>🎧 💌 원클릭 문의 및 오류, 제휴·광고 제안</span>
        </h4>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => onOpenInquiry('BUG')}
            className="px-4 py-2 rounded-full border border-rose-500/60 bg-rose-950/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>버그 & 오류 신고</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('INQUIRY')}
            className="px-4 py-2 rounded-full border border-sky-500/60 bg-sky-950/20 text-sky-400 hover:bg-sky-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>문의사항 남기기</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('FEATURE')}
            className="px-4 py-2 rounded-full border border-amber-500/60 bg-amber-950/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>기능 개선 제안</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInquiry('PARTNERSHIP')}
            className="px-4 py-2 rounded-full border border-emerald-500/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <Handshake className="w-3.5 h-3.5 text-emerald-400" />
            <span>제휴·광고 제안</span>
          </button>
        </div>
      </div>

      {/* Navigation Links: 이용약관 | 개인정보처리방침 */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold mb-5">
        <button
          type="button"
          onClick={onOpenTerms}
          className="text-gray-400 hover:text-cyan-300 transition-colors"
        >
          이용약관
        </button>
        <span className="text-gray-700">|</span>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-cyan-400 font-extrabold hover:text-cyan-300 underline underline-offset-4 transition-colors"
        >
          개인정보처리방침
        </button>
      </div>

      {/* Company Details & Statutory Intermediary Disclaimer */}
      <div className="max-w-3xl mx-auto text-center space-y-2 text-[11px] text-gray-500 leading-relaxed font-sans">
        <p className="font-extrabold text-gray-300 text-xs">
          TradeMe (트레이드미) <span className="text-gray-600 font-normal">|</span> 대한민국 소상공인 1:1 물물교환 & 상생 모바일 교환권 플랫폼
        </p>

        <p className="text-gray-400">
          상호명: TradeMe <span className="text-gray-600">|</span> 대표: 김동욱 <span className="text-gray-600">|</span> 주소: 경남 양산시 북정서길 25 104호
        </p>

        <p className="text-gray-400">
          대표 이메일:{' '}
          <a href="mailto:hanmaner@naver.com" className="text-cyan-400 hover:underline font-bold">
            hanmaner@naver.com
          </a>{' '}
          <span className="text-gray-600">|</span> 고객센터 운영시간: 24시간 실시간 온라인 접수 (영업일 기준 순차 처리)
        </p>

        <p className="text-[10px] text-gray-600 max-w-2xl mx-auto pt-1 leading-normal">
          [면책 고지] 트레이드미는 전자상거래 등에서의 소비자보호에 관한 법률 제20조 제2항에 따른 통신판매중개자로서 통신판매의 당사자가 아니며, 회원 간 물물교환 및 교환권 거래, 직거래 등에서 발생하는 일체의 분쟁 및 안전사고에 대한 책임은 당사자에게 있습니다.
        </p>
      </div>

      {/* Copyright with Triple-Click Easter Egg */}
      <div className="mt-8 pt-6 border-t border-gray-900/80 text-center">
        <p
          onClick={handleCopyrightClick}
          className="text-[11px] text-gray-600 select-none cursor-pointer hover:text-gray-400 transition-colors inline-block"
          title="Designed with Neon Glassmorphism"
        >
          Copyright © 2026 <strong className="text-gray-400 font-bold">TradeMe</strong>. All rights reserved. (Designed with Neon Glassmorphism)
        </p>
      </div>

    </footer>
  );
};
