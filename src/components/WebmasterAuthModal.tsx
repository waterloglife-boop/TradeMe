import React, { useState } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertTriangle } from 'lucide-react';
import { verifyMasterPassword } from '../lib/supabase';

interface WebmasterAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WebmasterAuthModal: React.FC<WebmasterAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMasterPassword(password)) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                <span>웹마스터 모드 보안 인증</span>
              </h3>
              <p className="text-xs text-gray-500">
                TradeMe 플랫폼 최고 관리자 전용 구역입니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setPassword('');
              onClose();
            }}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-600" />
              <span>마스터 보안 암호</span>
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="마스터 암호를 입력하세요"
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 outline-none transition-all ${
                error
                  ? 'border-red-400 bg-red-50 text-red-900 ring-2 ring-red-100'
                  : 'border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>마스터 보안 암호가 일치하지 않습니다. 다시 확인해 주세요.</span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            * 2차 보안 인증을 통과하면 웹마스터 대시보드로 즉시 연결됩니다.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setError(false);
                setPassword('');
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>관리자 모드 진입</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
