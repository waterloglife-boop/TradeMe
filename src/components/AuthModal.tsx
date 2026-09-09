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
  Inbox,
  Loader2,
  Calendar,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { signUpUser, signInUser, verifyNtsBusinessStatus, verifyNtsBusinessValidate, fetchUserProfileFromSupabase, uploadStoreImageToSupabase } from '../lib/supabase';
import { Store } from '../types/trade';
import { geocodeKoreanAddress } from '../utils/location';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userOwnerName: string;
  userStoreName: string;
  myStore?: Store;
  onLoginSuccess: (ownerName: string, storeName: string, registeredStore?: Store) => void;
  onUpdateProfile: (
    ownerName: string,
    storeName: string,
    phone: string,
    businessNumber?: string,
    storeImageUrl?: string,
    address?: string,
    breakTimeHours?: string,
    category?: string,
    lat?: number,
    lng?: number
  ) => void;
  onLogout: () => void;
  onOpenManageItems?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenTradeDashboard?: () => void;
  onOpenMenuTestDashboard?: () => void;
  onOpenCouponWallet?: () => void;
  voucherCount?: number;
  pendingTradeCount?: number;
  pendingMenuTestCount?: number;
  noticeMessage?: string | null;
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
  onOpenManageItems,
  onOpenRegisterModal,
  onOpenTradeDashboard,
  onOpenMenuTestDashboard,
  onOpenCouponWallet,
  voucherCount = 0,
  pendingTradeCount = 0,
  pendingMenuTestCount = 0,
  noticeMessage = null,
}) => {
  const [mode, setMode] = useState<'MYPAGE' | 'EDIT_PROFILE' | 'LOGIN' | 'SIGNUP'>('MYPAGE');

  // Form State - Empty by default for new login/signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [category, setCategory] = useState(myStore?.category || 'FOOD');
  const [address, setAddress] = useState('');
  const [breakTimeHours, setBreakTimeHours] = useState('10:00 - 22:00');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [geoSearching, setGeoSearching] = useState(false);

  const [storeImageUrl, setStoreImageUrl] = useState(
    myStore?.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ntsVerifying, setNtsVerifying] = useState(false);
  const [ntsStatusMessage, setNtsStatusMessage] = useState<string | null>(null);
  const [ntsResult, setNtsResult] = useState<{ isValid: boolean; message: string; isOwnerMatched?: boolean } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [duplicateField, setDuplicateField] = useState<'EMAIL' | 'PHONE' | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOwnerName('');
    setStoreName('');
    setPhone('');
    setBusinessNumber('');
    setStartDate('');
    setAgreedToTerms(false);
    setCategory('FOOD');
    setAddress('');
    setBreakTimeHours('10:00 - 22:00');
    setLat(undefined);
    setLng(undefined);
    setToastMessage(null);
    setDuplicateField(null);
    setNtsStatusMessage(null);
    setNtsResult(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (isLoggedIn) {
      setMode('MYPAGE');
      setOwnerName(userOwnerName || '');
      setStoreName(userStoreName || '');
      if (myStore?.storeImageUrl) setStoreImageUrl(myStore.storeImageUrl);
      if (myStore?.address) setAddress(myStore.address);
      if (myStore?.breakTimeHours) setBreakTimeHours(myStore.breakTimeHours);
      if (myStore?.category) setCategory(myStore.category);
      if (myStore?.lat) setLat(myStore.lat);
      if (myStore?.lng) setLng(myStore.lng);
      if (myStore?.phone) setPhone(myStore.phone);

      // 1. Restore from LocalStorage immediately
      try {
        const savedProfileRaw = localStorage.getItem('trademe_profile');
        if (savedProfileRaw) {
          const parsed = JSON.parse(savedProfileRaw);
          if (parsed.owner_name || parsed.ownerName) setOwnerName(parsed.owner_name || parsed.ownerName);
          if (parsed.store_name || parsed.storeName) setStoreName(parsed.store_name || parsed.storeName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.business_number || parsed.businessNumber) setBusinessNumber(parsed.business_number || parsed.businessNumber);
          if (parsed.store_image_url || parsed.storeImageUrl) setStoreImageUrl(parsed.store_image_url || parsed.storeImageUrl);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.break_time_hours || parsed.breakTimeHours || parsed.operating_hours) {
            setBreakTimeHours(parsed.break_time_hours || parsed.breakTimeHours || parsed.operating_hours);
          }
          if (parsed.category) setCategory(parsed.category);
        }
        const savedStoreRaw = localStorage.getItem('trademe_my_store');
        if (savedStoreRaw) {
          const parsedStore = JSON.parse(savedStoreRaw);
          if (parsedStore.breakTimeHours) setBreakTimeHours(parsedStore.breakTimeHours);
          if (parsedStore.address && !address) setAddress(parsedStore.address);
        }
      } catch (e) {}

      // 2. Fetch live profile row directly from Supabase DB
      fetchUserProfileFromSupabase().then((prof) => {
        if (prof) {
          if (prof.owner_name) setOwnerName(prof.owner_name);
          if (prof.store_name) setStoreName(prof.store_name);
          if (prof.phone) setPhone(prof.phone);
          if (prof.business_number) setBusinessNumber(prof.business_number);
          if (prof.store_image_url) setStoreImageUrl(prof.store_image_url);
          if (prof.address) setAddress(prof.address);
        }
      });
    } else {
      setMode('LOGIN');
      resetFormState();
    }
  }, [isOpen, isLoggedIn, userOwnerName, userStoreName, myStore]);

  // 🗺️ 지능형 한국 주소 좌표 자동 연동 핸들러
  const handleGeocodeAddress = async (addrToSearch: string, silent = false) => {
    const trimmed = addrToSearch.trim();
    if (!trimmed || trimmed.length < 3) return null;

    setGeoSearching(true);
    try {
      const result = await geocodeKoreanAddress(trimmed);
      if (result) {
        // 이미 유효한 기존 좌표가 있는데 지오코더가 기본값(서울시청)으로 반환된 경우 덮어쓰지 않고 보존
        if (result.source === 'default' && lat && lng && !(lat === 37.5665 && lng === 126.978)) {
          return result;
        }
        setLat(result.lat);
        setLng(result.lng);
        if (!silent && result.source !== 'default') {
          setToastMessage(`📍 지도 좌표가 자동으로 연동되었습니다! (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
          setTimeout(() => setToastMessage(null), 3000);
        }
        return result;
      }
    } catch (e) {
      console.warn('[AuthModal] Geocode failed:', e);
    } finally {
      setGeoSearching(false);
    }
    return null;
  };

  // 주소 입력 시 500ms 디바운스로 실시간 지도 좌표 자동 동기화 (Early return 이전에 훅 호출)
  useEffect(() => {
    if (!isOpen || (mode !== 'SIGNUP' && mode !== 'EDIT_PROFILE')) return;
    if (!address.trim() || address.trim().length < 4) return;

    const timer = setTimeout(() => {
      handleGeocodeAddress(address, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [address, isOpen, mode]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setToastMessage(null);
    const res = await uploadStoreImageToSupabase(file);
    setUploadingImage(false);

    if (res.success && res.url) {
      setStoreImageUrl(res.url);
    } else {
      setToastMessage(res.error || '이미지 업로드에 실패했습니다.');
    }
  };

  // 🏛️ 국세청 실시간 사업자 진위확인 API 핸들러 (대표자 성명 + 개업일자 + 사업자등록번호 1:1 대조)
  const handleVerifyNtsBusiness = async () => {
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');
    const cleanPnm = ownerName.trim();
    const cleanStartDt = startDate.replace(/[^0-9]/g, '');

    if (cleanBno.length !== 10) {
      const errMsg = '사업자등록번호 10자리를 (-) 없이 숫자만 정확히 입력해 주세요.';
      setNtsResult({ isValid: false, message: errMsg });
      setToastMessage(`⚠️ ${errMsg}`);
      alert(`⚠️ [국세청 사업자 조회 안내]\n\n${errMsg}`);
      return;
    }

    if (!cleanPnm) {
      const errMsg = '대표자 성함(사장님 성함)을 먼저 입력해 주세요.';
      setNtsResult({ isValid: false, message: errMsg });
      setToastMessage(`⚠️ ${errMsg}`);
      alert(`⚠️ [국세청 사업자 조회 안내]\n\n${errMsg}`);
      return;
    }

    setNtsVerifying(true);
    setToastMessage(null);
    setNtsResult(null);

    const res = await verifyNtsBusinessValidate(cleanBno, cleanPnm, cleanStartDt);
    setNtsVerifying(false);

    if (res.isValid) {
      setNtsStatusMessage(res.message);
      setNtsResult({ isValid: true, message: res.message, isOwnerMatched: res.isOwnerMatched });
      if (res.isOwnerMatched) {
        alert(`✅ [국세청 대표자 진위확인 성공]\n\n• 대표자 성명: ${cleanPnm}\n• 사업자등록번호: ${cleanBno}\n• 개업연월일: ${cleanStartDt}\n\n국세청 등록 원장과 100% 일치하는 정식 소상공인 대표자로 인증되었습니다.`);
      } else {
        alert(`✅ [국세청 사업자 인증 완료]\n\n${res.message}\n\n정상 영업 중인 사업자로 확인되었습니다.`);
      }
    } else {
      setNtsStatusMessage(null);
      setNtsResult({ isValid: false, message: res.message, isOwnerMatched: false });
      setToastMessage(`⚠️ ${res.message}`);
      alert(`⚠️ [국세청 조회 결과]\n\n${res.message}\n\n사업자번호, 대표자 성명, 개업연월일을 다시 한 번 확인해 주세요.`);
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanBno = businessNumber.replace(/[^0-9]/g, '');

    let finalLat = lat;
    let finalLng = lng;
    if ((!finalLat || !finalLng) && address.trim()) {
      const geoResult = await handleGeocodeAddress(address, true);
      if (geoResult) {
        finalLat = geoResult.lat;
        finalLng = geoResult.lng;
      }
    }

    onUpdateProfile(
      ownerName,
      storeName,
      cleanPhone,
      cleanBno,
      storeImageUrl,
      address,
      breakTimeHours,
      category,
      finalLat,
      finalLng
    );
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
          res.user?.user_metadata?.owner_name || '사장님',
          res.user?.user_metadata?.store_name || storeName || '내 매장',
          (res as any).store
        );
        setToastMessage(res.message ? (res.message.startsWith('✅') ? res.message : `✅ ${res.message}`) : '✅ 로그인되었습니다.');
        setTimeout(() => {
          onClose();
        }, 400);
      } else {
        setToastMessage(res.message ? (res.message.startsWith('⚠️') ? res.message : `⚠️ ${res.message}`) : '⚠️ 로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      }
      setLoading(false);
      return;
    } else if (mode === 'SIGNUP') {
      const lowerEmail = email.toLowerCase().trim();
      if (['owner@trademe.kr', 'admin@trademe.kr'].includes(lowerEmail)) {
        setToastMessage('⚠️ 이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.');
        setDuplicateField('EMAIL');
        setLoading(false);
        if (emailInputRef.current) emailInputRef.current.focus();
        return;
      }

      if (password.length < 6) {
        setToastMessage('⚠️ 비밀번호는 최소 6자리 이상으로 설정해 주세요.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setToastMessage('⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다. 다시 확인해 주세요.');
        setLoading(false);
        return;
      }

      if (!agreedToTerms) {
        setToastMessage('⚠️ [필수] 서비스 이용약관 및 통신판매중개·면책 사항에 동의해 주세요.');
        alert('⚠️ [필수 약관 동의 필요]\n\n서비스 이용약관 및 통신판매중개·교환권 면책 사항에 동의하셔야 사장님 가입이 완료됩니다.');
        setLoading(false);
        return;
      }

      if (!cleanBno || cleanBno.length !== 10) {
        setToastMessage('⚠️ 소상공인 신뢰 확보를 위해 사업자등록번호 10자리를 (-) 없이 입력해 주세요.');
        setLoading(false);
        return;
      }

      const cleanStartDt = startDate.replace(/[^0-9]/g, '');

      let finalLat = lat;
      let finalLng = lng;
      // 만약 회원가입 제출 시점에 좌표가 아직 미반영 상태라면 즉시 지오코딩 수행
      if ((!finalLat || !finalLng) && address.trim()) {
        const geoResult = await handleGeocodeAddress(address, true);
        if (geoResult) {
          finalLat = geoResult.lat;
          finalLng = geoResult.lng;
        }
      }

      const res = await signUpUser(
        email,
        password,
        ownerName,
        storeName,
        cleanBno,
        cleanPhone,
        category,
        address,
        finalLat,
        finalLng,
        cleanStartDt
      );
      
      if (!res.success && res.error === 'ALREADY_EXISTS') {
        setToastMessage(res.message || '⚠️ 이미 가입된 이메일 주소입니다. 다른 이메일 주소를 입력해 주시거나 로그인해 주세요.');
        setDuplicateField('EMAIL');
        setLoading(false);
        if (emailInputRef.current) emailInputRef.current.focus();
        return;
      }

      if (res.success) {
        onLoginSuccess(ownerName || '사장님', storeName || '내 매장', (res as any).store);
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
                    <span>{myStore?.address || '매장 주소 미등록'}</span>
                  </p>
                </div>
              </div>

              {/* Edit Profile Action Pill */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  사업자등록번호: <span className="font-mono text-gray-300 font-bold">{businessNumber || '미등록'}</span>
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

              {/* 🌟 영업시간 & 로그아웃 버튼 (사업자번호 바로 밑으로 상단 이동) */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>영업시간: <strong className="text-white font-bold">{myStore?.breakTimeHours || breakTimeHours || '10:00 - 22:00'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="text-gray-300 hover:text-red-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 transition-all text-xs active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>

            {/* Middle Section: Clean List View Menu Cards (리스트형 UI) */}
            <div className="p-5 space-y-3 bg-gray-50/70 flex-1">
              
              <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider px-1 mb-1">
                내 매장 관리 & 활동 대시보드
              </div>

              {/* 1. 내 물물교환 등록 품목 관리 (Step 2 직행) */}
              <div
                onClick={() => {
                  onClose();
                  if (onOpenManageItems) {
                    onOpenManageItems();
                  } else if (onOpenRegisterModal) {
                    onOpenRegisterModal();
                  }
                }}
                className="bg-white hover:bg-orange-50/50 p-4 rounded-2xl border border-gray-200 hover:border-orange-300 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    🍱
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                        내 물물교환 품목 및 상생 금액권 관리
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800">
                        {(myStore?.exchangeItems || []).filter(i => !i.isVoucher && i.type !== 'VOUCHER').length}개 메뉴 · {myStore?.voucherActive ? '금액권 ON' : '금액권 OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      등록된 메뉴 관리 및 매장 전용 상생 금액 교환권(자유이용 상품권) 설정
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>

              {/* 🎟️ 내 교환권 보관함 (받은 쿠폰 N/5장) */}
              {onOpenCouponWallet && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenCouponWallet();
                  }}
                  className="bg-white hover:bg-amber-50/50 p-4 rounded-2xl border border-gray-200 hover:border-amber-300 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      🎟️
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                          내 교환권 보관함 (받은 쿠폰)
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          voucherCount >= 5 ? 'bg-red-100 text-red-700 font-black' : 'bg-amber-100 text-amber-900'
                        }`}>
                          보유 {voucherCount} / 5장
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        이웃 사장님들에게 받은 상생 금액권 및 메뉴 교환권 사용 (슬라이드 결제)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              )}

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
                      {pendingTradeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-bounce shadow-sm">
                          새 제안 {pendingTradeCount}건
                        </span>
                      )}
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
                      {pendingMenuTestCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-bounce shadow-sm">
                          새 신청 {pendingMenuTestCount}건
                        </span>
                      ) : myStore?.isMenuTesting ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                          모집중
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      접수된 지원서 검토, 시식단 선정 및 1:1 대화방 개설
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>

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

              {/* Store Image Upload Section */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={storeImageUrl}
                    alt={storeName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-full shadow-md transition-all active:scale-95"
                    title="매장 사진 변경"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-gray-800 mb-0.5">매장 대표 사진</span>
                  <p className="text-[11px] text-gray-500 mb-2">
                    {uploadingImage ? '사진 업로드 중...' : '매장 외관이나 간판 사진을 올려주세요'}
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-[11px] rounded-xl border border-orange-300 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? '업로드 중...' : '사진 선택 및 변경'}</span>
                  </button>
                </div>
              </div>

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

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">업종 카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                >
                  <option value="FOOD">🍲 외식업 / 식당 (한식, 일식, 중식, 양식, 분식)</option>
                  <option value="CAFE">☕ 카페 / 디저트 / 베이커리</option>
                  <option value="PUB">🍺 주점 / 펍 / 바</option>
                  <option value="RETAIL">🛒 유통 / 편의 / 청과물</option>
                  <option value="BEAUTY">💇 미용 / 뷰티 / 헤어샵</option>
                  <option value="ACCOMMODATION">🏨 숙박 / 공간대여</option>
                  <option value="SERVICE">🧼 세탁 / 헬스 / 기타 생활서비스</option>
                </select>
              </div>

              {/* Road Address Input with Geocode Sync */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between">
                  <span>가게 도로명 주소</span>
                  {lat && lng ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                      <CheckCircle2 className="w-3 h-3" /> 좌표 자동연동됨
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-600 font-bold">지도 좌표 자동연동</span>
                  )}
                </label>
                <p className="text-[11px] text-gray-500 font-normal mb-1">💡 매장 주소 입력 시 네이버 지도 위치가 자동으로 동기화됩니다</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={() => {
                        if (address.trim()) handleGeocodeAddress(address, true);
                      }}
                      placeholder="예: 서울특별시 중구 세종대로 110"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGeocodeAddress(address)}
                    disabled={geoSearching}
                    className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-extrabold text-xs rounded-xl border border-orange-300 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                  >
                    {geoSearching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>연동중</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>좌표 동기화</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 주소 좌표 자동 연동 안내 배너 */}
                {address.trim() && (
                  <div className={`mt-1.5 p-2 rounded-xl text-[11px] font-bold flex items-center justify-between transition-all ${
                    lat && lng
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-orange-50 border border-orange-200 text-orange-900'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate">
                      {geoSearching ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600 flex-shrink-0" />
                          <span className="truncate">지도 좌표 실시간 탐색 중...</span>
                        </>
                      ) : lat && lng ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">
                            📍 매장 위치 확인 완료 ({lat.toFixed(4)}, {lng.toFixed(4)})
                          </span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span className="truncate">도로명 주소를 입력하면 지도 좌표가 자동 연동됩니다</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Operating / Exchange Hours */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-0.5">매장 영업시간 (교환 가능 시간)</label>
                <p className="text-[11px] text-gray-500 font-normal mb-1">💡 이웃 사장님들이 물물교환 또는 픽업 가능한 시간대</p>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={breakTimeHours}
                    onChange={(e) => setBreakTimeHours(e.target.value)}
                    placeholder="예: 10:00 - 22:00 또는 15:00 - 17:00"
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

              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-600" />
                    <span>사업자등록번호 & 대표자 진위확인</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 국세청 1:1 대조
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                      <span>① 사업자등록번호 (10자리)</span>
                      <span className="text-[10px] text-gray-400">숫자만 입력</span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={businessNumber}
                      onChange={(e) => {
                        setBusinessNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setNtsResult(null);
                      }}
                      placeholder="1234567890"
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition-all bg-white ${
                        ntsResult === null
                          ? 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                          : ntsResult.isValid
                          ? 'border-emerald-500 ring-2 ring-emerald-100'
                          : 'border-rose-400 ring-2 ring-rose-100'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                      <span>② 개업연월일 (8자리)</span>
                      <span className="text-[10px] text-amber-700 font-bold">대표자 일치 검증용</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          maxLength={8}
                          placeholder="예: 20210515 (YYYYMMDD)"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value.replace(/[^0-9]/g, ''));
                            setNtsResult(null);
                          }}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs outline-none font-mono font-bold bg-white focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyNtsBusiness}
                        disabled={ntsVerifying}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                      >
                        {ntsVerifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>대조 중...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>국세청 진위확인</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📌 국세청 실시간 인증/오류 안내 박스 */}
                {ntsResult && (
                  <div
                    className={`mt-1 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in border ${
                      ntsResult.isValid
                        ? ntsResult.isOwnerMatched
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {ntsResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="leading-snug">
                      <p className="font-extrabold text-[12px]">
                        {ntsResult.isValid
                          ? ntsResult.isOwnerMatched
                            ? '✅ 국세청 대표자명 1:1 진위확인 완료'
                            : '✅ 국세청 계속사업자 확인 완료'
                          : '⚠️ 국세청 인증 불가'}
                      </p>
                      <p className="text-[11px] font-medium mt-0.5">{ntsResult.message}</p>
                    </div>
                  </div>
                )}
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
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
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
                type="button"
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
                type="button"
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
              
              {noticeMessage && (
                <div className="bg-orange-50 border border-orange-300 text-orange-950 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in shadow-sm">
                  <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{noticeMessage}</div>
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
                    placeholder="예: owner@trademe.kr"
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
                    placeholder="비밀번호를 입력해 주세요 (6자리 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                {mode === 'LOGIN' && (
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>💡 비밀번호 분실 시 가입한 휴대폰번호(또는 뒷 4자리)로도 로그인 가능합니다</span>
                  </p>
                )}
              </div>

              {mode === 'SIGNUP' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>비밀번호 확인</span>
                      {confirmPassword && (
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {password === confirmPassword ? '✓ 비밀번호 일치' : '✕ 비밀번호 불일치'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="비밀번호를 한 번 더 입력해 주세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                          !confirmPassword
                            ? 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                            : password === confirmPassword
                            ? 'border-emerald-400 ring-1 ring-emerald-400 bg-emerald-50/20'
                            : 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">사장님 성함</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="예: 홍길동 사장님"
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">업종 카테고리</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                    >
                      <option value="FOOD">🍲 외식업 / 식당 (한식, 일식, 중식, 양식, 분식)</option>
                      <option value="CAFE">☕ 카페 / 디저트 / 베이커리</option>
                      <option value="PUB">🍺 주점 / 펍 / 바</option>
                      <option value="RETAIL">🛒 유통 / 편의 / 청과물</option>
                      <option value="BEAUTY">💇 미용 / 뷰티 / 헤어샵</option>
                      <option value="ACCOMMODATION">🏨 숙박 / 공간대여</option>
                      <option value="SERVICE">🧼 세탁 / 헬스 / 기타 생활서비스</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between">
                      <span>가게 도로명 주소</span>
                      {lat && lng ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3" /> 좌표 자동연동됨
                        </span>
                      ) : (
                        <span className="text-[10px] text-orange-600 font-bold">지도 좌표 자동연동</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="예: 서울특별시 중구 세종대로 110"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          onBlur={() => {
                            if (address.trim()) handleGeocodeAddress(address, true);
                          }}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGeocodeAddress(address)}
                        disabled={geoSearching}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-extrabold text-xs rounded-xl border border-orange-300 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                      >
                        {geoSearching ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>연동중</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>좌표 연동</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 주소 좌표 자동 연동 안내 배너 */}
                    {address.trim() && (
                      <div className={`mt-1.5 p-2 rounded-xl text-[11px] font-bold flex items-center justify-between transition-all ${
                        lat && lng
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : 'bg-orange-50 border border-orange-200 text-orange-900'
                      }`}>
                        <div className="flex items-center gap-1.5 truncate">
                          {geoSearching ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600 flex-shrink-0" />
                              <span className="truncate">지도 좌표 실시간 탐색 중...</span>
                            </>
                          ) : lat && lng ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">
                                📍 매장 위치 확인 완료 ({lat.toFixed(4)}, {lng.toFixed(4)})
                              </span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                              <span className="truncate">도로명 주소를 입력하면 지도 좌표가 자동 연동됩니다</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">연락처 (휴대폰 번호)</label>
                    <p className="text-[11px] text-gray-500 font-normal mb-1">💡 (-) 하이픈 제외하고 번호만 입력</p>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        ref={phoneInputRef}
                        type="text"
                        placeholder="예: 01012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-600" />
                        <span>사업자등록정보 & 국세청 대표자 진위확인</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> 1:1 대조인증
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                          <span>① 사업자등록번호 (10자리)</span>
                          <span className="text-[10px] text-gray-400">숫자만 입력</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          placeholder="예: 1234567890"
                          value={businessNumber}
                          onChange={(e) => {
                            setBusinessNumber(e.target.value.replace(/[^0-9]/g, ''));
                            setNtsResult(null);
                          }}
                          className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition-all bg-white ${
                            ntsResult === null
                              ? 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                              : ntsResult.isValid
                              ? 'border-emerald-500 ring-2 ring-emerald-100'
                              : 'border-rose-400 ring-2 ring-rose-100'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                          <span>② 개업연월일 (8자리)</span>
                          <span className="text-[10px] text-amber-700 font-bold">국세청 대표자 대조용</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              maxLength={8}
                              placeholder="예: 20210515 (YYYYMMDD)"
                              value={startDate}
                              onChange={(e) => {
                                setStartDate(e.target.value.replace(/[^0-9]/g, ''));
                                setNtsResult(null);
                              }}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs outline-none font-mono font-bold bg-white focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyNtsBusiness}
                            disabled={ntsVerifying}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                          >
                            {ntsVerifying ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>대조 중...</span>
                              </>
                            ) : (
                              <>
                                <Search className="w-3.5 h-3.5" />
                                <span>진위확인</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 📌 국세청 실시간 인증/오류 안내 박스 */}
                    {ntsResult && (
                      <div
                        className={`mt-1 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in border ${
                          ntsResult.isValid
                            ? ntsResult.isOwnerMatched
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        {ntsResult.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="leading-snug">
                          <p className="font-extrabold text-[12px]">
                            {ntsResult.isValid
                              ? ntsResult.isOwnerMatched
                                ? '✅ 국세청 대표자 1:1 진위확인 완료'
                                : '⚠️ 사업자 상태 유효 (대표자 불일치 주의)'
                              : '⚠️ 국세청 인증 불가'}
                          </p>
                          <p className="text-[11px] font-medium mt-0.5">
                            {ntsResult.isValid && ntsResult.isOwnerMatched
                              ? `입력하신 사장님 성함(${ownerName || '대표자'})과 국세청 등록 원장이 100% 일치합니다.`
                              : ntsResult.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🛡️ 통신판매중개자 법적 지위 및 뱅크런·부도 면책 약관 필수 동의 */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
                      <input
                        type="checkbox"
                        id="termsAgree"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600 flex-shrink-0"
                        required
                      />
                      <label htmlFor="termsAgree" className="text-gray-700 leading-snug cursor-pointer select-none flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-orange-950">
                            [필수] 서비스 이용약관 및 통신판매중개·교환권 면책 동의
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-800 underline whitespace-nowrap ml-1"
                          >
                            전문 보기 &gt;
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          본 플랫폼은 통신판매중개자로서 회원 간 교환권의 발행·사용에 관여하지 않으며, 특정 업체의 부도·뱅크런·미이행 시 어떠한 지급보증도 제공하지 않음에 동의합니다.
                        </p>
                      </label>
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

              {mode === 'LOGIN' && (
                <div className="pt-2 border-t border-gray-100 flex flex-col items-center gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@trademe.kr');
                      setPassword('1901123');
                      setToastMessage(null);
                    }}
                    className="text-xs font-extrabold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl border border-orange-200 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>👑 웹마스터 테스트 계정 원클릭 입력 (admin@trademe.kr)</span>
                  </button>
                  <p className="text-[10px] text-gray-400">
                    💡 마라위크 매장과의 1:1 대화 및 맞교환권 테스트용 공식 계정입니다.
                  </p>
                </div>
              )}

            </form>
          </div>
        )}

        {/* 📜 이용약관 및 통신판매중개 면책 전문 모달 */}
        {showTermsModal && (
          <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-gray-900">
                    트레이드미(TradeMe) 이용약관 및 통신판매중개 면책 조항
                  </h3>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 leading-relaxed font-sans">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold">
                  📢 [필독] 트레이드미는 전자상거래 등에서의 소비자보호에 관한 법률 제20조 제2항에 따른 &apos;통신판매중개자&apos;로서 회원 간 물물교환 및 교환권 거래의 당사자가 아닙니다.
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">1</span>
                    제1조 (통신판매중개자로서의 법적 지위)
                  </h4>
                  <p className="text-gray-600 pl-6">
                    트레이드미(이하 &apos;플랫폼&apos;)는 등록된 자영업자·소상공인 회원(이하 &apos;회원&apos;) 간 보유 물품 및 서비스 이용권(모바일 교환권)의 자율적인 상호 교환을 원활히 할 수 있도록 시스템 플랫폼을 제공하는 <strong>통신판매중개자</strong>입니다. 플랫폼은 개별 거래의 주체나 계약 당사자가 아니며, 거래 물품 및 교환권의 실제 이행 여부에 대해 직접 책임을 지지 않습니다.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">2</span>
                    제2조 (교환권 자율 발행 및 금융 지급보증 배제)
                  </h4>
                  <p className="text-gray-600 pl-6">
                    회원이 플랫폼을 통해 생성·발행하는 모든 교환권은 각 가맹 사업자가 본인의 영업 자산과 신용을 기반으로 <strong>자율적으로 발행</strong>하는 것입니다. 플랫폼은 금융기관, 신용보증기금 또는 결제대행업자가 아니며, 발행된 교환권에 대하여 예금자보호법, 전자금융거래법 등에 따른 <strong>어떠한 지급보증·지급준비금 예치 의무도 부담하지 않습니다.</strong>
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">3</span>
                    제3조 (뱅크런·부도·폐업 및 채무불이행 시 면책)
                  </h4>
                  <div className="text-gray-600 pl-6 space-y-1.5">
                    <p>
                      ① 특정 회원 매장의 과도한 교환권 발행, 경영 악화, 고의 폐업, 부도, 야반도주, <strong>뱅크런(동시다발적 교환 요구 불능)</strong> 등으로 인하여 교환권의 사용이 거부되거나 채무가 불이행되는 경우, 그에 따른 모든 민·형사상 법적 책임 및 원상회복 의무는 <strong>교환권을 발행한 사업자 당사자</strong>에게 귀속됩니다.
                    </p>
                    <p>
                      ② 플랫폼은 관계 법령에 위배되지 않는 한 회원 간 발생한 부도·불이행 손해에 대하여 <strong>대위변제, 환불, 손해배상 등의 법적 책임을 전면 면책</strong>합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">4</span>
                    제4조 (플랫폼 안전 장치 및 리스크 관리 조치)
                  </h4>
                  <div className="text-gray-600 pl-6 space-y-1">
                    <p>
                      플랫폼은 선량한 사장님들의 피해 방지와 먹튀·사기 행위 근절을 위하여 다음과 같은 안전망을 운영하며, 회원은 이에 동의합니다:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[11px] text-gray-500">
                      <li>국세청(NTS) 공식 API를 통한 사업자등록번호·대표자명·개업일자 3-Way 실시간 1:1 진위확인</li>
                      <li>악의적 교환권 남발을 방지하기 위한 계정당 최대 동시 교환권 발행·보유 5장 상한선 제한</li>
                      <li>불이행 신고 접수 시 즉각적인 계정 영구 제명 및 국세청 사업자 정보 기반 형사고발 조치 협조</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-medium">
                  동의 시 통신판매중개자 면책 조항에 공식 효력이 발생합니다.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
                >
                  약관 확인 및 동의하기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

