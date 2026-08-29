import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  Building,
  ShieldCheck,
  ArrowRight,
  User,
  LogOut,
  CheckCircle2,
  Phone,
  AlertTriangle,
  Search,
  Check,
  ChevronRight,
  Edit3,
  Utensils,
  ArrowRightLeft,
  FlaskConical,
  Clock,
  MapPin,
  Sparkles,
  Inbox
} from 'lucide-react';
import { signUpUser, signInUser, verifyNtsBusinessStatus, fetchUserProfileFromSupabase } from '../lib/supabase';
import { Store } from '../types/trade';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userOwnerName: string;
  userStoreName: string;
  myStore?: Store;
  onLoginSuccess: (ownerName: string, storeName: string) => void;
  onUpdateProfile: (ownerName: string, storeName: string, phone: string, businessNumber?: string) => void;
  onLogout: () => void;
  onOpenRegisterModal?: () => void;
  onOpenTradeDashboard?: () => void;
  onOpenMenuTestDashboard?: () => void;
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
  myStore,
  onLoginSuccess,
  onUpdateProfile,
  onLogout,
  onOpenRegisterModal,
  onOpenTradeDashboard,
  onOpenMenuTestDashboard,
}) => {
  const [mode, setMode] = useState<'MYPAGE' | 'EDIT_PROFILE' | 'LOGIN' | 'SIGNUP'>('MYPAGE');

  // Form State - Always initialized with persistent values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState(userOwnerName || '김동욱');
  const [storeName, setStoreName] = useState(userStoreName || '마라위크');
  const [phone, setPhone] = useState('01048548777');
  const [businessNumber, setBusinessNumber] = useState('4074913710');
  const [loading, setLoading] = useState(false);
  const [ntsVerifying, setNtsVerifying] = useState(false);
  const [ntsStatusMessage, setNtsStatusMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [duplicateField, setDuplicateField] = useState<'EMAIL' | 'PHONE' | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setToastMessage(null);
    setDuplicateField(null);
    setNtsStatusMessage(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (isLoggedIn) {
      setMode('MYPAGE');
      setOwnerName(userOwnerName || '김동욱');
      setStoreName(userStoreName || '마라위크');

      // 1. Restore from LocalStorage immediately
      try {
        const savedProfileRaw = localStorage.getItem('trademe_profile');
        if (savedProfileRaw) {
          const parsed = JSON.parse(savedProfileRaw);
          if (parsed.ownerName) setOwnerName(parsed.ownerName);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.businessNumber) setBusinessNumber(parsed.businessNumber);
        }
      } catch (e) {}

      // 2. Fetch live profile row directly from Supabase DB
      fetchUserProfileFromSupabase().then((prof) => {
        if (prof) {
          if (prof.owner_name) setOwnerName(prof.owner_name);
          if (prof.store_name) setStoreName(prof.store_name);
          if (prof.phone) setPhone(prof.phone);
          if (prof.business_number) setBusinessNumber(prof.business_number);

          try {
            localStorage.setItem('trademe_profile', JSON.stringify({
              ownerName: prof.owner_name || '김동욱',
              storeName: prof.store_name || '마라위크',
              phone: prof.phone || '01048548777',
              businessNumber: prof.business_number || '4074913710',
            }));
          } catch (e) {}
        }
      });
    } else {
      setMode('LOGIN');
      resetFormState();
    }
  }, [isOpen, isLoggedIn, userOwnerName, userStoreName]);

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

  const handleProfileUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');

    onUpdateProfile(ownerName, storeName, cleanPhone, cleanBno);
    setSaveSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setSaveSuccess(false);
      setMode('MYPAGE');
    }, 1200);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);
    setDuplicateField(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');

    if (mode === 'LOGIN') {
      const res = await signInUser(email, password);
      if (res.success) {
        onLoginSuccess(
          res.user?.user_metadata?.owner_name || '홍길동 사장님',
          res.user?.user_metadata?.store_name || storeName || '송정 수제돈까스'
        );
        onClose();
      }
    } else if (mode === 'SIGNUP') {
      const lowerEmail = email.toLowerCase().trim();
      if (['owner@trademe.kr', 'admin@trademe.kr'].includes(lowerEmail)) {
        setToastMessage('⚠️ 이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.');
        setDuplicateField('EMAIL');
        setLoading(false);
        if (emailInputRef.current) emailInputRef.current.focus();
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
        if (emailInputRef.current) emailInputRef.current.focus();
        return;
      }

      if (res.success) {
        onLoginSuccess(ownerName || '홍길동 사장님', storeName || '송정 수제돈까스');
        onClose();
      }
    }

    setLoading(false);
  };

  const storeImage = myStore?.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
  const itemCount = myStore?.exchangeItems?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ========================================================================= */}
        {/* 1. LOGGED IN: MY PAGE (마이페이지 올인원 심플 허브) */}
        {/* ========================================================================= */}
        {isLoggedIn && mode === 'MYPAGE' && (
          <div className="flex flex-col flex-1 overflow-y-auto">
            
            {/* Top Profile Hero Card */}
            <div className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-white p-6 pb-5 flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={storeImage}
                    alt={storeName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-sm" title="국세청 인증 사장님">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500 text-white">
                      {myStore?.categoryName || '외식/요식업'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      인증 사장님
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">
                    {storeName}
                  </h2>
                  
                  <p className="text-xs text-gray-300 font-medium flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-orange-400" />
                    <span>{ownerName} 사장님</span>
                    <span className="text-gray-500">·</span>
                    <span>{phone ? phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '연락처 미등록'}</span>
                  </p>

                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span>{myStore?.address || '경남 양산시 북정서길 25 104호'}</span>
                  </p>
                </div>
              </div>

              {/* Edit Profile Action Pill */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  사업자등록번호: <span className="font-mono text-gray-300 font-bold">{businessNumber || '407-49-13710'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('EDIT_PROFILE')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>프로필 편집</span>
                </button>
              </div>
            </div>

            {/* Middle Section: Clean List View Menu Cards (리스트형 UI) */}
            <div className="p-5 space-y-3 bg-gray-50/70 flex-1">
              
              <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider px-1 mb-1">
                내 매장 관리 & 활동 대시보드
              </div>

              {/* 1. 내 물물교환 등록 품목 관리 */}
              <div
                onClick={() => {
                  onClose();
                  if (onOpenRegisterModal) onOpenRegisterModal();
                }}
                className="bg-white hover:bg-orange-50/50 p-4 rounded-2xl border border-gray-200 hover:border-orange-300 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    🍱
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                        내 물물교환 등록 품목 관리
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800">
                        {itemCount}개 등록중
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      등록된 메뉴 가격 수정, 사진 교체 및 신규 메뉴 추가
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>

              {/* 2. 1:1 물물교환 제안함 */}
              <div
                onClick={() => {
                  onClose();
                  if (onOpenTradeDashboard) onOpenTradeDashboard();
                }}
                className="bg-white hover:bg-amber-50/50 p-4 rounded-2xl border border-gray-200 hover:border-amber-300 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    🤝
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-amber-700 transition-colors">
                        1:1 물물교환 제안함 (거래 관리)
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      이웃 사장님들의 실시간 제안 및 비동기 찔러보기 확인
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>

              {/* 3. 신메뉴 체험단 모집 현황 */}
              <div
                onClick={() => {
                  onClose();
                  if (onOpenMenuTestDashboard) onOpenMenuTestDashboard();
                }}
                className="bg-white hover:bg-purple-50/50 p-4 rounded-2xl border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    🧪
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                        신메뉴 시식단 & 서포터즈 모집 관리
                      </h4>
                      {myStore?.isMenuTesting && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 animate-pulse">
                          모집중
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      접수된 지원서 검토, 시식단 선정 및 1:1 대화방 개설
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>

            </div>

            {/* Bottom Footer Section: Subtle Status & Logout */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>영업시간: <strong>{myStore?.breakTimeHours || '10:00 - 22:00'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-gray-500 hover:text-red-600 font-bold flex items-center gap-1 p-1 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. LOGGED IN: EDIT PROFILE MODE (프로필 편집 모드) */}
        {/* ========================================================================= */}
        {isLoggedIn && mode === 'EDIT_PROFILE' && (
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 font-bold text-base">
                <Edit3 className="w-5 h-5" />
                <span>사장님 프로필 정보 수정</span>
              </div>
              <button
                type="button"
                onClick={() => setMode('MYPAGE')}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdateSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>수정사항이 성공적으로 저장되었습니다!</span>
                </div>
              )}

              {toastMessage && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{toastMessage}</div>
                </div>
              )}

              {ntsStatusMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{ntsStatusMessage}</span>
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
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01012345678"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between">
                  <span>사업자등록번호 (10자리)</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 국세청 인증
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono font-bold"
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

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('MYPAGE')}
                  className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>수정 내용 저장</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. LOGGED OUT: LOGIN / SIGNUP TABS (로그인 & 회원가입) */}
        {/* ========================================================================= */}
        {!isLoggedIn && (
          <div className="flex flex-col flex-1">
            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setMode('LOGIN');
                  resetFormState();
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
                  resetFormState();
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

            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              
              {toastMessage && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{toastMessage}</div>
                </div>
              )}

              {ntsStatusMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{ntsStatusMessage}</span>
                </div>
              )}

              <div className="text-center mb-2">
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {mode === 'LOGIN' ? 'Trade Me 로그인' : '소상공인 사장님 회원가입'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  1:1 물물교환으로 식사, 상품 및 서비스를 맞교환하세요
                </p>
              </div>

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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
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
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
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
                        placeholder="01012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono font-bold"
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
        )}

      </div>
    </div>
  );
};

