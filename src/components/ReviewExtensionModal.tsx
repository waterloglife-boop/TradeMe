import React, { useState } from 'react';
import { X, Sparkles, Download, Lock, CheckCircle2, Chrome, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';

interface ReviewExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userOwnerName?: string;
  onOpenAuthModal: () => void;
}

export const ReviewExtensionModal: React.FC<ReviewExtensionModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  userOwnerName,
  onOpenAuthModal,
}) => {
  const [copiedKeyGuide, setCopiedKeyGuide] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState(true);

  if (!isOpen) return null;

  const handleCopyGeminiUrl = () => {
    navigator.clipboard.writeText('https://aistudio.google.com/app/apikey');
    setCopiedKeyGuide(true);
    setTimeout(() => setCopiedKeyGuide(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 배너 (퍼플/오렌지 그라데이션) */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-orange-600 text-white p-5 sm:p-6 overflow-hidden flex-shrink-0">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-32 h-32 bg-orange-400/20 rounded-full blur-xl pointer-events-none" />

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 뱃지 & 타이틀 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-gray-950 shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 사장님 전용 100% 무료
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              크롬 확장 프로그램 v1.3.0
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>배민 & 네이버 플레이스</span>
            <span className="text-amber-300">AI 리뷰 답글 비서</span>
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-1">
            마감 후 밀린 리뷰 스트레스는 이제 그만! 클릭 단 한 번으로 3초 만에 단골 만드는 감동 답글을 써드립니다.
          </p>
        </div>

        {/* 모달 본문 (스크롤 가능) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-gray-800 scroll-touch flex-1">
          
          {/* 🌟 핵심 4대 기능 안내 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
                ⚡
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-purple-950">3초 만에 단골 만드는 맞춤 답글</h4>
                <p className="text-[11px] sm:text-xs text-purple-800/80 mt-0.5 leading-relaxed">
                  손님이 시킨 메뉴(치즈추가, 세트 등)와 별점을 분석해 정성 어린 사장님 말투로 답글 자동 완성!
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
                🎯
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950">'별점5점님' 호칭 버그 해결</h4>
                <p className="text-[11px] sm:text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                  네이버 영수증 리뷰의 기계적인 호칭 실수를 없애고, 친절하고 자연스러운 첫인사로 자동 교정합니다.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
                🥡
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-950">포장 & 재방문 고객 자동 감지</h4>
                <p className="text-[11px] sm:text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                  배민 포장 주문이나 네이버 n번째 방문 손님을 자동으로 알아채어 맞춤형 감사 인사를 전합니다.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
                🔒
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-blue-950">개인정보 보호 & 평생 무료</h4>
                <p className="text-[11px] sm:text-xs text-blue-800/80 mt-0.5 leading-relaxed">
                  아이디·비밀번호를 외부 서버에 저장하지 않는 안전한 브라우저 구동! 구글 무료 API로 평생 0원.
                </p>
              </div>
            </div>
          </div>

          {/* 🔑 로그인 검증 및 다운로드 섹션 (핵심 게이트웨이) */}
          <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            isLoggedIn 
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-emerald-300 shadow-sm'
              : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border-amber-300 shadow-sm'
          }`}>
            {isLoggedIn ? (
              // [로그인 상태]: 다운로드 버튼 활성화
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-emerald-950">
                    {userOwnerName ? `${userOwnerName} 사장님` : '트레이드미 회원님'}, 무료 이용 자격이 확인되었습니다!
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  확장 프로그램을 다운로드하신 뒤, 프로그램 팝업창에서 <b>현재 트레이드미 계정으로 로그인</b>하시면 배달의민족과 네이버 스마트플레이스에서 즉시 <b>[✨ AI 답글 생성]</b> 기능을 무료로 사용하실 수 있습니다.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <a
                    href="/trademe-review-extension.zip"
                    download="trademe-review-extension.zip"
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>확장 프로그램 다운로드 (.ZIP)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowStepGuide(!showStepGuide)}
                    className="px-3 py-2 text-xs font-bold text-emerald-900 bg-white/70 hover:bg-white rounded-xl border border-emerald-200 transition cursor-pointer"
                  >
                    {showStepGuide ? '설치 방법 접기 ▲' : '설치 방법 보기 ▼'}
                  </button>
                </div>
              </div>
            ) : (
              // [비로그인 상태]: 로그인 락인 유도
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-amber-950">
                    트레이드미 사장님 회원 전용 무료 혜택입니다
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  본 프로그램은 골목상권 사장님들의 상생과 매장 운영 지원을 위해 <b>트레이드미 회원님들께 100% 무료</b>로 제공됩니다. 1초 간편 로그인 후 즉시 다운로드해 보세요!
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <span>🔑 트레이드미 로그인 / 1초 간편가입</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 📋 설치 가이드 4단계 (체크리스트) */}
          {showStepGuide && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
              <h5 className="font-extrabold text-gray-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <Chrome className="w-4 h-4 text-orange-600" />
                <span>크롬 브라우저 1분 설치 방법 (초간단)</span>
              </h5>

              <ol className="space-y-2.5 text-gray-700 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  위 <b>[확장 프로그램 다운로드]</b> 버튼을 눌러 <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono">trademe-review-extension.zip</code> 파일의 압축을 풉니다.
                </li>
                <li className="leading-relaxed">
                  크롬 브라우저 주소창에 <code className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded font-mono">chrome://extensions</code> 를 입력하고 이동합니다.
                </li>
                <li className="leading-relaxed">
                  화면 우측 상단의 <b>[개발자 모드]</b> 스위치를 켭니다.
                </li>
                <li className="leading-relaxed">
                  좌측 상단에 나타난 <b>[압축해제된 확장 프로그램을 로드합니다]</b> 버튼을 누르고, 압축을 푼 폴더를 선택합니다.
                </li>
                <li className="leading-relaxed">
                  크롬 우측 상단 퍼즐(🧩) 아이콘에서 <b>'트레이드미'</b>를 누르고 <b>트레이드미 계정으로 로그인</b>하면 배민 사장님광장과 네이버 스마트플레이스 리뷰 창에 <b>[✨ AI 답글 생성]</b> 버튼이 즉시 활성화됩니다!
                </li>
              </ol>

              {/* 무료 API 키 발급 팁 */}
              <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-600">
                <span className="flex items-center gap-1">
                  💡 <b>무료 AI 키(Gemini):</b> 구글 AI 스튜디오에서 평생 무료 API 키를 발급받아 등록하시면 무제한 답글이 가능합니다.
                </span>
                <button
                  type="button"
                  onClick={handleCopyGeminiUrl}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition flex-shrink-0 cursor-pointer"
                >
                  {copiedKeyGuide ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKeyGuide ? '발급 주소 복사됨!' : '발급 주소 복사'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 모달 하단 푸터 */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>트레이드미 자영업자 상생 프로젝트</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition active:scale-95 cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
