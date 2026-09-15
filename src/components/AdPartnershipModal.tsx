import React, { useState } from 'react';
import {
  X,
  Megaphone,
  Send,
  CheckCircle2,
  Building2,
  Sparkles,
  TrendingUp,
  Phone,
  Mail,
  Store,
  Ticket,
  Flame,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import { createCustomerInquiry } from '../lib/supabase';

interface AdPartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultZone?: 'TOP_BANNER' | 'STORE_FEED' | 'COUPON_WALLET' | 'ALL';
}

export const AdPartnershipModal: React.FC<AdPartnershipModalProps> = ({
  isOpen,
  onClose,
  defaultZone = 'ALL',
}) => {
  const [selectedZone, setSelectedZone] = useState<string>(defaultZone);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('식자재 도매/유통');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPhone.trim()) {
      alert('업체명/성함 및 연락처를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const zoneNameMap: Record<string, string> = {
        TOP_BANNER: '메인 홈 지도 상단 띠배너',
        STORE_FEED: '우리 동네 가맹점 목록 피드 카드',
        COUPON_WALLET: '내 교환권 보관함 공식 스폰서 배너',
        ALL: '전 구역 통합 패키지 제휴',
      };

      const title = `[광고제휴 문의] ${companyName} (${zoneNameMap[selectedZone] || '미정'})`;
      const content = `■ 신청 기업/매장명: ${companyName}\n■ 담당자명: ${contactName || '미기재'}\n■ 연락처: ${contactPhone}\n■ 희망 광고 구역: ${zoneNameMap[selectedZone] || selectedZone}\n■ 주요 업종: ${industry}\n■ 문의/제휴 희망 내용:\n${message || '빠른 상담 요청합니다.'}`;

      createCustomerInquiry({
        type: 'PARTNERSHIP',
        senderName: `${companyName} (${contactName || '대표'})`,
        senderContact: contactPhone,
        title,
        content,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit ad partnership inquiry:', err);
      alert('접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adZones = [
    {
      id: 'TOP_BANNER',
      badge: 'ZONE 01 · 최다 노출',
      title: '메인 홈 지도 상단 프리미엄 띠배너',
      subtitle: '앱 실행 시 모든 사장님이 가장 먼저 마주하는 최상단 독점 명당',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      features: ['일간 수만 회 노출', '상단 고정 노출 효과', '원클릭 외부 링크 / 전화 연결'],
      recommended: '식자재 도매, 프랜차이즈 가맹 모집, 자영업 금융/렌탈',
      bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'border-amber-300',
    },
    {
      id: 'STORE_FEED',
      badge: 'ZONE 02 · 상권 집중',
      title: '우리 동네 가맹점 모아보기 피드 광고',
      subtitle: '인근 상권 사장님들이 물물교환 매장을 탐색할 때 자연스럽게 각인되는 네이티브 광고',
      icon: <Store className="w-5 h-5 text-emerald-500" />,
      features: ['상권 탐색 점주 100% 타겟', '친근한 매장형 네이티브 카드', '지역 밀착형 전환율 극대화'],
      recommended: '포장용기/배달용품, 주방설비/수리, 세무/노무/인테리어',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-emerald-300',
    },
    {
      id: 'COUPON_WALLET',
      badge: 'ZONE 03 · 고소득 활성 점주',
      title: '내 교환권 보관함 스폰서십 배너',
      subtitle: '실제 교환 거래와 정산이 가장 활발한 실명 점주들이 매일 사용하는 핵심 공간',
      icon: <Ticket className="w-5 h-5 text-purple-500" />,
      features: ['실제 거래 사장님 집중 방문', '단골 점주 충성도 연계', '브랜드 스폰서십 인지도 상승'],
      recommended: 'POS/키오스크 솔루션, 배달대행 플랫폼, 주류/음료 도매',
      bgGradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'border-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* 상단 헤더 */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden flex-shrink-0">
          <div className="relative z-10 space-y-1.5 max-w-[85%]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full shadow-xs">
              <Megaphone className="w-3.5 h-3.5" />
              <span>광고주 및 B2B 제휴사 공식 모집</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>여기 광고하실 광고주님 모십니다!</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              지역 자영업자·소상공인 사장님들이 매일 접속하는 플랫폼에서 최고의 전환율을 경험하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 z-10"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 배경 패턴 데코 */}
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
            <Building2 className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {isSubmitted ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">
                  광고 제휴 상담 신청이 완료되었습니다!
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  남겨주신 연락처로 전담 매니저가 24시간 이내에 맞춤형 광고 단가표와 예상 노출 데이터를 안내해 드리겠습니다.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition"
                >
                  확인 완료
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 3대 황금 광고 구역 선택 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>광고 희망 구역을 선택해 주세요</span>
                  </h3>
                  <span className="text-[11px] text-gray-500 font-bold">클릭하여 선택</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {adZones.map((zone) => {
                    const isSelected = selectedZone === zone.id;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZone(zone.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer relative select-none ${
                          isSelected
                            ? `${zone.borderColor} bg-gradient-to-r ${zone.bgGradient} shadow-md ring-2 ring-indigo-500/20`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-2xs border border-gray-100 flex-shrink-0 mt-0.5">
                              {zone.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                  {zone.badge}
                                </span>
                                <h4 className="font-extrabold text-sm text-gray-900">
                                  {zone.title}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 font-medium leading-snug">
                                {zone.subtitle}
                              </p>
                              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-700 font-bold">
                                <span>추천:</span>
                                <span className="text-gray-700 font-medium">{zone.recommended}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0 pt-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <BadgeCheck className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 핵심 강점 배너 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>트레이드미 B2B 광고의 차별화된 3가지 강점</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <p className="text-xs font-black text-slate-900">🎯 100% 실명 점주</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">자영업 사장님 다이렉트 도달</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <p className="text-xs font-black text-slate-900">📍 지역 상권 타겟</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">내 매장 인근 상권 초밀착 노출</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <p className="text-xs font-black text-slate-900">💰 합리적 광고비</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">초기 제휴 특별 할인 혜택</p>
                  </div>
                </div>
              </div>

              {/* 간편 상담 신청 폼 */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>30초 빠른 광고 제휴 상담 신청</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        업체명 / 상호명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="예: (주)대한식자재유통 또는 홍길동"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        담당자 성함 (선택)
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="예: 김마케팅 팀장"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        연락처 (전화번호) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        주요 업종 / 분야
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                      >
                        <option value="식자재 도매/유통">식자재 도매 / 유통</option>
                        <option value="포장용기/배달용품">포장용기 / 일회용품 / 배달박스</option>
                        <option value="POS/키오스크/결제기">POS / 키오스크 / 테이블오더</option>
                        <option value="주방기물/설비">주방 기기 / 인테리어 / 간판</option>
                        <option value="세무/노무/법무">세무 / 노무 / 행정 기장</option>
                        <option value="프랜차이즈 가맹모집">프랜차이즈 본사 / 가맹점 모집</option>
                        <option value="기타 B2B 비즈니스">기타 자영업자 대상 B2B</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      상담 희망 내용 및 요청사항
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="희망하시는 집행 일정이나 예산, 궁금하신 점을 자유롭게 적어주세요."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? '접수 처리 중...' : '광고 제휴 상담 신청하기 (무료)'}</span>
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    ※ 신청 접수 시 전담 매니저가 24시간 이내에 유선 또는 카카오톡으로 안내드립니다.
                  </p>
                </div>
              </form>
            </>
          )}

        </div>

        {/* 모달 하단 연락처 고지 바 */}
        <div className="bg-gray-50 p-3 sm:px-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-700">제휴 직통 문의:</span>
            <span className="flex items-center gap-1 font-semibold text-gray-600">
              <Phone className="w-3 h-3 text-indigo-600" />
              070-8095-2630
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-gray-600">
              <Mail className="w-3 h-3 text-indigo-600" />
              partnership@trademe.kr
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-bold px-2 py-1 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
