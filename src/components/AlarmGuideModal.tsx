import React from 'react';
import { X, Bell, BellRing, Smartphone, ShieldCheck, AlertCircle, Volume2 } from 'lucide-react';

interface AlarmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnable: () => void;
}

export const AlarmGuideModal: React.FC<AlarmGuideModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnable,
}) => {
  if (!isOpen) return null;

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isPermissionDenied = isSupported && Notification.permission === 'denied';

  return (
    <div className="fixed inset-0 z-[170] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden border border-orange-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
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

        {/* Body Content */}
        <div className="p-5 space-y-3 text-xs text-gray-700 leading-relaxed max-h-[75vh] overflow-y-auto font-sans">
          
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
              <div className="p-2 bg-white/80 rounded-xl text-[10px] text-rose-900 font-semibold border border-rose-100">
                💡 브라우저 설정을 변경하지 않더라도, 아래 <strong>[앱 내 소리 알람 켜기]</strong>를 누르시면 화면이 켜져 있을 때의 맑은 &apos;띵동~&apos; 소리 알람을 바로 이용하실 수 있습니다!
              </div>
            </div>
          )}

          {/* Benefit 1: Real-time alert */}
          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-xs mb-0.5">
                즉시 도착 알림 (소리 & 팝업)
              </h4>
              <p className="text-[11px] text-emerald-800 leading-normal">
                이웃 사장님의 <strong>새로운 물물교환 제안</strong>이나 <strong>1:1 채팅 메시지</strong>가 오면 맑은 알림음과 함께 바로 알려드립니다.
              </p>
            </div>
          </div>

          {/* Important Permission Notice (if not blocked) */}
          {!isPermissionDenied && (
            <div className="flex items-start gap-3 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs mb-0.5">
                  ⚠️ [필독] 브라우저 알림 &apos;허용&apos; 필수
                </h4>
                <p className="text-[11px] text-amber-900 leading-normal">
                  아래 버튼을 누르면 스마트폰 상단에 <strong>&apos;알림을 허용하시겠습니까?&apos;</strong> 창이 뜹니다. 반드시 <strong className="underline decoration-amber-600 font-extrabold">&apos;허용&apos;</strong>을 눌러주셔야 푸시 알림을 정상적으로 받으실 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* iOS Safari Tip */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200/80 rounded-2xl">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-0.5">
                💡 모바일 꿀팁 안내
              </h4>
              <p className="text-[11px] text-gray-600 leading-normal">
                브라우저 메뉴에서 <strong>[홈 화면에 추가]</strong>를 하시면 일반 앱과 동일하게 바탕화면에서 한 번에 켜고 실시간 알림을 가장 안정적으로 받으실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
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
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>알림 허용하고 소리 켜기</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-200 bg-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            다음에 할게요 (무음 유지)
          </button>
        </div>

      </div>
    </div>
  );
};
