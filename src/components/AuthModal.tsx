import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, Building, ShieldCheck, ArrowRight, User, LogOut, CheckCircle2, Phone, AlertTriangle } from 'lucide-react';
import { signUpUser, signInUser, signInWithSocial } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userOwnerName: string;
  userStoreName: string;
  onLoginSuccess: (ownerName: string, storeName: string) => void;
  onUpdateProfile: (ownerName: string, storeName: string, phone: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  userOwnerName,
  userStoreName,
  onLoginSuccess,
  onUpdateProfile,
  onLogout,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'PROFILE'>('LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState(userOwnerName || '사장님 (마라위크)');
  const [storeName, setStoreName] = useState(userStoreName || '마라위크 (양산 북정점)');
  const [phone, setPhone] = useState('055-385-1234');
  const [businessNumber, setBusinessNumber] = useState('123-45-67890');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [duplicateField, setDuplicateField] = useState<'EMAIL' | 'PHONE' | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Registered Emails Registry for Mock/Live Email Duplicate Validation
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([
    'owner@trademe.kr',
    'mara@naver.com',
    'admin@trademe.kr'
  ]);

  // Registered Phone Numbers Registry for Phone Duplicate Validation
  const [registeredPhones, setRegisteredPhones] = useState<string[]>([
    '01012345678',
    '01099998888',
    '0553818892'
  ]);

  useEffect(() => {
    if (isLoggedIn) {
      setMode('PROFILE');
      setOwnerName(userOwnerName);
      setStoreName(userStoreName);
    } else {
      setMode('LOGIN');
    }
    setToastMessage(null);
    setDuplicateField(null);
  }, [isLoggedIn, userOwnerName, userStoreName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);
    setDuplicateField(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (mode === 'PROFILE') {
      onUpdateProfile(ownerName, storeName, phone);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setLoading(false);
      return;
    }

    if (mode === 'LOGIN') {
      const res = await signInUser(email, password);
      if (res.success) {
        onLoginSuccess(
          res.user?.user_metadata?.owner_name || '사장님 (마라위크)',
          res.user?.user_metadata?.store_name || storeName || '마라위크 (양산 북정점)'
        );
        onClose();
      }
    } else {
      // 1. Duplicate Email Check
      const lowerEmail = email.toLowerCase().trim();
      if (registeredEmails.includes(lowerEmail)) {
        setToastMessage('⚠️ 이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.');
        setDuplicateField('EMAIL');
        setLoading(false);
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
        return;
      }

      // 2. Duplicate Phone Number Check
      if (cleanPhone && registeredPhones.includes(cleanPhone)) {
        setToastMessage('⚠️ 이미 등록된 휴대폰 번호입니다. 다른 연락처를 입력해 주세요.');
        setDuplicateField('PHONE');
        setLoading(false);
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
        return;
      }

      if (!businessNumber) {
        alert('소상공인 신뢰 확보를 위해 사업자등록번호를 입력해 주세요.');
        setLoading(false);
        return;
      }

      const res = await signUpUser(email, password, ownerName, storeName, businessNumber, phone);
      
      if (!res.success && res.error === 'ALREADY_EXISTS') {
        setToastMessage(res.message || '⚠️ 이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.');
        setDuplicateField('EMAIL');
        setLoading(false);
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
        return;
      }

      if (res.success) {
        setRegisteredEmails((prev) => [...prev, lowerEmail]);
        if (cleanPhone) setRegisteredPhones((prev) => [...prev, cleanPhone]);
        onLoginSuccess(ownerName || '사장님 (마라위크)', storeName || '마라위크 (양산 북정점)');
        onClose();
      }
    }

    setLoading(false);
  };

  const handleNaverLogin = async () => {
    await signInWithSocial('naver');
    onLoginSuccess('네이버 사장님', '마라위크 (양산 북정점)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        
        {/* Header Tabs */}
        {isLoggedIn ? (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
            <div className="flex items-center gap-2 font-bold text-base">
              <User className="w-5 h-5" />
              <span>👤 내 사장님 프로필 정보 수정</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setMode('LOGIN');
                setToastMessage(null);
                setDuplicateField(null);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${
                mode === 'LOGIN'
                  ? 'border-orange-500 text-orange-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setMode('SIGNUP');
                setToastMessage(null);
                setDuplicateField(null);
              }}
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
        )}

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toast Notification Alert Banner */}
          {toastMessage && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{toastMessage}</div>
            </div>
          )}

          {/* PROFILE EDIT MODE */}
          {mode === 'PROFILE' && (
            <>
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>프로필 수정사항이 성공적으로 저장되었습니다!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">사장님 성함</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">대표 가게 상호명</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">연락처 (휴대폰 번호)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    ref={phoneInputRef}
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (duplicateField === 'PHONE') {
                        setToastMessage(null);
                        setDuplicateField(null);
                      }
                    }}
                    placeholder="010-1234-5678"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none ${
                      duplicateField === 'PHONE'
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>사업자등록번호 (10자리)</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 인증완료
                  </span>
                </label>
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <span>프로필 수정 내용 저장</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl transition-all border border-gray-200 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </>
          )}

          {/* LOGIN / SIGNUP MODE */}
          {mode !== 'PROFILE' && (
            <>
              <div className="text-center mb-2">
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {mode === 'LOGIN' ? 'Trade Me 로그인' : '소상공인 사장님 회원가입'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  1:1 물물교환으로 식사, 상품 및 서비스를 맞교환하세요
                </p>
              </div>

              {/* Naver Social Login Button */}
              <div>
                <button
                  type="button"
                  onClick={handleNaverLogin}
                  className="w-full py-3 px-4 bg-[#03C75A] hover:bg-[#02b350] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="font-black text-base bg-white text-[#03C75A] w-5 h-5 rounded-full flex items-center justify-center text-xs">N</span>
                  네이버 아이디로 1초 만에 로그인
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-2 text-[11px] text-gray-400 font-medium">또는 자체 계정</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Email & Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">이메일 주소</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    placeholder="owner@trademe.kr"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (duplicateField === 'EMAIL') {
                        setToastMessage(null);
                        setDuplicateField(null);
                      }
                    }}
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none ${
                      duplicateField === 'EMAIL'
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                    }`}
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
                        placeholder="사장님 (마라위크)"
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
                        placeholder="마라위크 (양산 북정점)"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">연락처 (휴대폰 번호)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        ref={phoneInputRef}
                        type="text"
                        placeholder="010-1234-5678"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (duplicateField === 'PHONE') {
                            setToastMessage(null);
                            setDuplicateField(null);
                          }
                        }}
                        className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none ${
                          duplicateField === 'PHONE'
                            ? 'border-amber-500 ring-2 ring-amber-200'
                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                        }`}
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
            </>
          )}

        </form>

      </div>
    </div>
  );
};
