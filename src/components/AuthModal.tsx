import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, Building, ShieldCheck, ArrowRight, User, LogOut, CheckCircle2, Phone, AlertTriangle, Search, Check } from 'lucide-react';
import { signUpUser, signInUser, verifyNtsBusinessStatus } from '../lib/supabase';

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

// 🇰🇷 국세청 사업자등록번호 10자리 검증 알고리즘 (Modulus-11)
export function checkValidBusinessNumber(bno: string): boolean {
  const clean = bno.replace(/[^0-9]/g, '');
  if (clean.length !== 10) return false;
  const keys = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * keys[i];
  }
  sum += Math.floor((parseInt(clean[8], 10) * 5) / 10);
  const remainder = (10 - (sum % 10)) % 10;
  return remainder === parseInt(clean[9], 10);
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
  const [ownerName, setOwnerName] = useState(userOwnerName || '홍길동 사장님');
  const [storeName, setStoreName] = useState(userStoreName || '송정 수제돈까스');
  const [phone, setPhone] = useState('0553851234');
  const [businessNumber, setBusinessNumber] = useState('1234567890');
  const [loading, setLoading] = useState(false);
  const [ntsVerifying, setNtsVerifying] = useState(false);
  const [ntsStatusMessage, setNtsStatusMessage] = useState<string | null>(null);
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
    setNtsStatusMessage(null);
  }, [isLoggedIn, userOwnerName, userStoreName, isOpen]);

  if (!isOpen) return null;

  // 🇰🇷 국세청 실시간 사업자 상태조회 API 핸들러
  const handleVerifyNtsBusiness = async () => {
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');
    if (cleanBno.length !== 10) {
      setToastMessage('⚠️ 사업자등록번호 10자리를 (-) 없이 숫자만 정확히 입력해 주세요.');
      return;
    }
    setNtsVerifying(true);
    setToastMessage(null);

    const res = await verifyNtsBusinessStatus(cleanBno);
    setNtsVerifying(false);

    if (res.isValid) {
      setNtsStatusMessage(res.message);
    } else {
      setNtsStatusMessage(null);
      setToastMessage(`⚠️ ${res.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);
    setDuplicateField(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');

    if (mode === 'PROFILE') {
      onUpdateProfile(ownerName, storeName, cleanPhone);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setLoading(false);
      return;
    }

    if (mode === 'LOGIN') {
      const res = await signInUser(email, password);
      if (res.success) {
        onLoginSuccess(
          res.user?.user_metadata?.owner_name || '홍길동 사장님',
          res.user?.user_metadata?.store_name || storeName || '송정 수제돈까스'
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

      if (!cleanBno || cleanBno.length !== 10) {
        setToastMessage('⚠️ 소상공인 신뢰 확보를 위해 사업자등록번호 10자리를 (-) 없이 입력해 주세요.');
        setLoading(false);
        return;
      }

      const res = await signUpUser(email, password, ownerName, storeName, cleanBno, cleanPhone);
      
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
        onLoginSuccess(ownerName || '홍길동 사장님', storeName || '송정 수제돈까스');
        onClose();
      }
    }

    setLoading(false);
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

          {/* NTS Verification Success Banner */}
          {ntsStatusMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{ntsStatusMessage}</span>
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
                <label className="block text-xs font-bold text-gray-700 mb-0.5">사장님 성함</label>
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
                <label className="block text-xs font-bold text-gray-700 mb-0.5">대표 가게 상호명</label>
                <p className="text-[11px] text-gray-500 font-normal mb-1">💡 간판명으로 작성 부탁드려요</p>
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
                <label className="block text-xs font-bold text-gray-700 mb-0.5">연락처 (휴대폰 번호)</label>
                <p className="text-[11px] text-gray-500 font-normal mb-1">💡 (-) 하이픈 제외하고 번호만 입력</p>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    ref={phoneInputRef}
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      if (duplicateField === 'PHONE') {
                        setToastMessage(null);
                        setDuplicateField(null);
                      }
                    }}
                    placeholder="01012345678"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none ${
                      duplicateField === 'PHONE'
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between">
                  <span>사업자등록번호 (10자리)</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 국세청 인증완료
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 font-normal mb-1">💡 (-) 하이픈 제외하고 번호만 입력</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1234567890"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyNtsBusiness}
                    disabled={ntsVerifying}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{ntsVerifying ? '조회 중...' : '국세청 조회'}</span>
                  </button>
                </div>
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
                        placeholder="홍길동 사장님"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">가게 상호명</label>
                    <p className="text-[11px] text-gray-500 font-normal mb-1">💡 간판명으로 작성 부탁드려요</p>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="예: 송정 수제돈까스"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">연락처 (휴대폰 번호)</label>
                    <p className="text-[11px] text-gray-500 font-normal mb-1">💡 (-) 하이픈 제외하고 번호만 입력</p>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        ref={phoneInputRef}
                        type="text"
                        placeholder="01012345678"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/[^0-9]/g, ''));
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
                    <label className="block text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between">
                      <span>사업자등록번호 (10자리)</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> 실시간 인증가능
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-500 font-normal mb-1">💡 (-) 하이픈 제외하고 번호만 입력</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="1234567890"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyNtsBusiness}
                        disabled={ntsVerifying}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{ntsVerifying ? '조회 중...' : '국세청 조회'}</span>
                      </button>
                    </div>
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
