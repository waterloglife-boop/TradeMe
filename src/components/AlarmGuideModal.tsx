import React, { useState } from 'react';
import { X, Bell, BellRing, Smartphone, ShieldCheck, AlertCircle, Volume2, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';

interface AlarmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnable: () => void;
  onSendTestNotification?: () => void;
}

export const AlarmGuideModal: React.FC<AlarmGuideModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnable,
  onSendTestNotification,
}) => {
  if (!isOpen) return null;

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isPermissionDenied = isSupported && Notification.permission === 'denied';
  const isPermissionGranted = isSupported && Notification.permission === 'granted';

  // 기기 환경 감지 (iOS 여부 및 홈 화면 PWA 앱 설치 실행 여부)
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );

  const [deviceTab, setDeviceTab] = useState<'IPHONE' | 'GALAXY'>(isIOS ? 'IPHONE' : 'GALAXY');

  return (
    <div className="fixed inset-0 z-[170] bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden border border-orange-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                실시간 거래 & 대화 알림 켜기
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                소상공인 맞교환 및 사장님 채팅을 놓치지 마세요!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 선택기 (아이폰 vs 갤럭시) */}
        <div className="px-4 pt-3 bg-gray-50/80 border-b border-gray-100">
          <div className="flex bg-gray-200/70 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setDeviceTab('IPHONE')}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceTab === 'IPHONE'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🍎</span>
              <span>아이폰 (iPhone) 설정법</span>
              {deviceTab === 'IPHONE' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </button>
            <button
              type="button"
              onClick={() => setDeviceTab('GALAXY')}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceTab === 'GALAXY'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🤖</span>
              <span>갤럭시 (Android) 설정법</span>
              {deviceTab === 'GALAXY' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-3 text-xs text-gray-700 leading-relaxed max-h-[68vh] overflow-y-auto font-sans">
          
          {/* ==================================================== */}
          {/* 🍎 아이폰 탭 내용                                    */}
          {/* ==================================================== */}
          {deviceTab === 'IPHONE' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* 아이폰 필수 안내 경고 배너 */}
              {!isStandalone ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>⚠️ [필독] 아이폰은 &apos;홈 화면 추가&apos; 필수</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-normal font-medium">
                    애플(iOS) 보안 정책상 <strong>사파리 웹 브라우저 창 상태에서는 푸시 알림이 원천 차단</strong>됩니다. 반드시 아래 <strong>3단계</strong>를 통해 홈 화면에 앱으로 추가하셔야 화면이 꺼져 있어도 잠금화면 푸시를 받으실 수 있습니다!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-[11px] font-bold">
                    🎉 아이폰 홈 화면 앱 모드로 정상 접속 중입니다! 아래 [알림 허용]을 누르시면 잠금화면 푸시가 활성화됩니다.
                  </p>
                </div>
              )}

              {/* 아이폰 3단계 설정 가이드 */}
              <div className="bg-gradient-to-br from-gray-50 to-orange-50/40 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                <h4 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>아이폰 실시간 푸시 3단계 설정법</span>
                </h4>

                {/* 1단계 */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-blue-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      <span>사파리 하단 가운데</span>
                      <strong className="text-blue-600 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        <Share2 className="w-3 h-3" /> [공유]
                      </strong>
                      <span>버튼 터치</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      사파리 브라우저 맨 아래 메뉴 바 가운데 있는 네모 속 위쪽 화살표(⬆️) 아이콘을 누릅니다.
                    </p>
                  </div>
                </div>

                {/* 2단계 */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      <span>메뉴를 올려</span>
                      <strong className="text-indigo-600 flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        <PlusSquare className="w-3 h-3" /> [홈 화면에 추가]
                      </strong>
                      <span>터치</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      오른쪽 상단 <strong>&apos;추가&apos;</strong>를 누르면 아이폰 바탕화면에 <strong>&apos;트레이드미&apos;</strong> 앱이 설치됩니다.
                    </p>
                  </div>
                </div>

                {/* 3단계 */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      <span>홈 화면의</span>
                      <strong className="text-orange-600 font-black">&apos;트레이드미&apos; 앱</strong>
                      <span>실행 후 알림 허용</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      홈 화면에 생긴 아이콘을 누르고 [알림 허용] 팝업이 뜨면 <strong>[허용]</strong>을 눌러주세요! 이제 화면이 꺼져 있어도 잠금화면 푸시가 옵니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 🤖 갤럭시 탭 내용                                    */}
          {/* ==================================================== */}
          {deviceTab === 'GALAXY' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* If Blocked Warning & Guide */}
              {isPermissionDenied && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>현재 브라우저 알림 권한이 [차단]되어 있습니다</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-normal">
                    스마트폰 브라우저 상단 주소창 왼쪽의 <strong>🔒(자물쇠)</strong> 또는 <strong>🎛️(설정)</strong> 아이콘을 눌러 <strong>[알림]</strong>을 <strong>&apos;허용&apos;</strong>으로 변경해 주시면 화면이 꺼져 있어도 푸시를 받으실 수 있습니다.
                  </p>
                </div>
              )}

              {/* Benefit 1: Real-time alert */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs mb-0.5">
                    즉시 도착 알림 (상단바 배너 · 진동 · 소리)
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    이웃 사장님의 <strong>새로운 물물교환 제안</strong>, <strong>1:1 채팅 메시지</strong>, <strong>사랑방 댓글</strong>이 오면 스마트폰 상단바 배너와 진동, 알림음으로 즉시 알려드립니다.
                  </p>
                </div>
              </div>

              {/* 갤럭시 2단계 간편 설정법 */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>갤럭시 알림 켜는 법 (2초 완성)</span>
                </h4>
                <p className="text-[11px] text-amber-900 leading-normal">
                  1. 브라우저 주소창 왼쪽의 <strong>🔒(자물쇠)</strong> 아이콘 터치<br />
                  2. <strong>[권한] → [알림]</strong>을 <strong>&apos;허용&apos;</strong>으로 변경<br />
                  3. 아래 <strong>[알림 허용하고 소리 켜기]</strong>를 누르면 끝!
                </p>
              </div>

              {/* 갤럭시 홈화면 추가 팁 */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200/80 rounded-2xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs mb-0.5">
                    💡 갤럭시 전용 꿀팁
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-normal">
                    크롬 또는 삼성 인터넷 오른쪽 위 메뉴(<strong>⋮</strong>)에서 <strong>[홈 화면에 앱 추가]</strong>를 하시면 바탕화면에서 한 번에 켜고 가장 안정적으로 실시간 알림을 받으실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 공통: 상단바 알림 테스트 섹션 */}
          {onSendTestNotification && (
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2 mt-2">
              <div>
                <h4 className="font-bold text-blue-950 text-xs mb-0.5 flex items-center gap-1.5">
                  <span>🧪</span>
                  <span>상단바 알림 즉시 테스트</span>
                </h4>
                <p className="text-[11px] text-blue-700">
                  내 폰에 알림이 제대로 뜨는지 지금 바로 확인해 보세요!
                </p>
              </div>
              <button
                type="button"
                onClick={onSendTestNotification}
                className="px-3 py-1.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition whitespace-nowrap cursor-pointer"
              >
                테스트 발송
              </button>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          {deviceTab === 'IPHONE' && !isStandalone ? (
            <button
              type="button"
              onClick={() => {
                alert('🍎 아이폰 알림 안내:\\n\\n사파리 화면 맨 밑의 [공유 (네모 속 ⬆️ 화살표)]를 누르신 후, [홈 화면에 추가]를 눌러 앱으로 접속해 주셔야 잠금화면 알림을 받으실 수 있습니다!');
                onConfirmEnable();
              }}
              className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>사파리 하단 [공유] ➔ [홈 화면에 추가]</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmEnable}
              className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPermissionDenied ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>앱 내 소리 알람 켜기</span>
                </>
              ) : isPermissionGranted ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span>알림 설정 완료 (켜짐 유지)</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>알림 허용하고 소리 켜기</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-200 bg-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
