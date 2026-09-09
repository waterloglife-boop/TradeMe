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
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B132B] border border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.35)] rounded-3xl p-6 overflow-hidden">
        
        {/* Subtle Ambient Neon Background Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/90 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-cyan-400 tracking-tight flex items-center gap-1.5">
              <span>웹마스터 모드 보안 인증</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setPassword('');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-cyan-300 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
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
              className={`w-full px-4 py-3 bg-[#070D1E] border rounded-2xl text-sm font-bold text-white placeholder-gray-500 outline-none transition-all ${
                error
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : 'border-cyan-800/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
              }`}
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-shake">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>마스터 보안 암호가 일치하지 않습니다. 다시 입력해 주세요.</span>
            </div>
          )}

          <p className="text-[11px] text-gray-400 font-medium">
            * 최고 관리자 전용 2차 보안 인증 구역입니다.
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
              className="px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-extrabold text-xs transition-colors active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>웹마스터 모드 진입</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
