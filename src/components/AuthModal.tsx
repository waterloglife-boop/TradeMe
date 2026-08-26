import React, { useState } from 'react';
import { X, Lock, Mail, Building, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { signUpUser, signInUser, signInWithSocial } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (ownerName: string, storeName: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'LOGIN') {
      const res = await signInUser(email, password);
      if (res.success) {
        onLoginSuccess(
          res.user?.user_metadata?.owner_name || '사장님',
          res.user?.user_metadata?.store_name || storeName || '내 가게'
        );
      }
    } else {
      if (!businessNumber) {
        alert('소상공인 신뢰 확보를 위해 사업자등록번호를 입력해 주세요.');
        setLoading(false);
        return;
      }
      const res = await signUpUser(email, password, ownerName, storeName, businessNumber);
      if (res.success) {
        onLoginSuccess(ownerName || '사장님', storeName || '신규 등록 가게');
      }
    }

    setLoading(false);
    onClose();
  };

  const handleSocialLogin = async (provider: 'kakao' | 'naver') => {
    await signInWithSocial(provider);
    onLoginSuccess(`${provider === 'naver' ? '네이버' : '카카오'} 사장님`, '송정 해운대 식당');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${
              mode === 'LOGIN'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('SIGNUP')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${
              mode === 'SIGNUP'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            사장님 회원가입
          </button>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-2">
            <h3 className="font-extrabold text-gray-900 text-lg">
              {mode === 'LOGIN' ? 'Trade Me 로그인 (Supabase)' : '소상공인 사장님 회원가입 (Supabase)'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              1:1 등가교환으로 맛있는 식사 및 서비스를 바꿔먹으세요
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSocialLogin('naver')}
              className="py-2.5 px-3 bg-[#03C75A] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center justify-center gap-1.5"
            >
              <span className="font-black text-sm">N</span> 네이버 로그인
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="py-2.5 px-3 bg-[#FEE500] text-gray-900 font-bold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center justify-center gap-1.5"
            >
              <span className="font-black text-sm">K</span> 카카오 로그인
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-2 text-[11px] text-gray-400 font-medium">또는 이메일</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Email & Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">이메일 주소</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="owner@trademe.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Signup Specific Fields */}
          {mode === 'SIGNUP' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">사장님 성함</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="홍길동 사장님"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">가게 상호명</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="원조 송정 수제돈까스"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>사업자등록번호 (10자리)</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 인증필수
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="123-45-67890"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 mt-2"
          >
            <span>{loading ? '처리 중...' : mode === 'LOGIN' ? '로그인 하기' : '사장님 무료 가입 및 시작'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
