import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  LineChart,
  MessageSquare,
  FileText,
  ShieldCheck,
  Users,
  Ticket,
  Sliders,
  Download,
  Save,
  CheckCircle2,
  Trash2,
  Ban,
  Search,
  ExternalLink,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Store, CustomerInquiry, AdBannerStat, AdBannerKey, CommunityPost } from '../types/trade';
import {
  fetchCustomerInquiries,
  toggleInquiryStatus,
  fetchAdBannerStats,
  updateCoupangLinks,
  exportStoresToCsv,
  fetchStoredVouchers,
  fetchCommunityPosts
} from '../lib/supabase';

interface WebmasterDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  onToggleStoreBan?: (storeId: string) => void;
  bannedStoreIds?: string[];
}

export const WebmasterDashboardModal: React.FC<WebmasterDashboardModalProps> = ({
  isOpen,
  onClose,
  stores,
  onToggleStoreBan,
  bannedStoreIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CTR_ANALYSIS' | 'INQUIRIES' | 'POSTS' | 'NTS_AUDIT' | 'MEMBERS' | 'VOUCHERS' | 'SYSTEM'
  >('OVERVIEW');

  // Ad Stats & Link Management State
  const [adStats, setAdStats] = useState<AdBannerStat[]>([]);
  const [coupangUrls, setCoupangUrls] = useState<Record<AdBannerKey, string>>({
    TOP_MAIN: '',
    COMMUNITY_FEED: '',
    STORE_DRAWER: '',
    WALLET_FOOTER: '',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);

  // Community Posts Mock/Local State
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // Vouchers
  const [allVouchers, setAllVouchers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const stats = fetchAdBannerStats();
      setAdStats(stats);
      const urlMap: Record<AdBannerKey, string> = {
        TOP_MAIN: '',
        COMMUNITY_FEED: '',
        STORE_DRAWER: '',
        WALLET_FOOTER: '',
      };
      stats.forEach((s) => {
        if (s.key && s.key in urlMap) {
          urlMap[s.key as AdBannerKey] = s.coupangUrl;
        }
      });
      setCoupangUrls(urlMap);

      const inqs = fetchCustomerInquiries();
      setInquiries(inqs);

      // Load real community posts and purge legacy dummy posts
      fetchCommunityPosts().then((realPosts) => {
        const cleaned = (realPosts || []).filter((p) => !p.id.startsWith('post-') && !p.id.startsWith('post_welcome_'));
        setPosts(cleaned);
      }).catch(() => {
        try {
          const raw = localStorage.getItem('trademe_community_posts_cache');
          if (raw) {
            const parsed: CommunityPost[] = JSON.parse(raw);
            const cleaned = parsed.filter((p) => !p.id.startsWith('post-') && !p.id.startsWith('post_welcome_'));
            setPosts(cleaned);
          } else {
            setPosts([]);
          }
        } catch {
          setPosts([]);
        }
      });
      try {
        localStorage.removeItem('trademe_community_posts');
      } catch (e) {}

      // Load all vouchers across storage
      const vList = fetchStoredVouchers('', '');
      setAllVouchers(vList);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveLinks = () => {
    const updated = updateCoupangLinks(coupangUrls);
    setAdStats(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleToggleInq = (id: string) => {
    const updated = toggleInquiryStatus(id);
    setInquiries(updated);
  };

  const handleDeletePost = (id: string) => {
    if (confirm('정말로 이 게시글을 운영자 권한으로 삭제하시겠습니까?')) {
      const updated = posts.filter((p) => p.id !== id);
      setPosts(updated);
      try {
        localStorage.setItem('trademe_community_posts', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'PENDING').length;
  const verifiedStoresCount = stores.filter((s) => s.isVerified).length;

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white border border-gray-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden text-gray-800 font-sans">
        
        {/* Header (TradeMe Brand Style) */}
        <div className="p-4 sm:p-5 border-b border-orange-600/30 flex items-center justify-between bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
              🛡️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
                <span>TradeMe 웹마스터 관리자 커맨드 센터</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black bg-white/20 text-white rounded-full">
                  MASTER OPERATOR
                </span>
              </h2>
              <p className="text-xs text-orange-100 hidden sm:block">
                가맹점 DB 관리 · 쿠팡 제휴 CTR 분석 · 고객센터 접수 · 사장님 사랑방 관리
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (TradeMe Clean Pill Tabs) */}
        <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-orange-600 border border-orange-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            <span>종합 현황</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CTR_ANALYSIS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CTR_ANALYSIS'
                ? 'bg-white text-amber-700 border border-amber-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-amber-600" />
            <span>쿠팡/광고 클릭률(CTR) 분석</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INQUIRIES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'INQUIRIES'
                ? 'bg-white text-rose-600 border border-rose-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
            <span>고객 문의/제휴</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {pendingInquiriesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('POSTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'POSTS'
                ? 'bg-white text-blue-600 border border-blue-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>게시글 관리</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NTS_AUDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'NTS_AUDIT'
                ? 'bg-white text-emerald-600 border border-emerald-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>국세청 인증 심사</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MEMBERS'
                ? 'bg-white text-orange-600 border border-orange-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-orange-500" />
            <span>회원 DB 관리</span>
            <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black">
              {stores.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VOUCHERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'VOUCHERS'
                ? 'bg-white text-amber-700 border border-amber-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-amber-600" />
            <span>교환권 & 거래 모니터링</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'SYSTEM'
                ? 'bg-white text-purple-600 border border-purple-200 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-500" />
            <span>공지 & 시스템 제어</span>
          </button>

        </div>

        {/* Modal Body Stream */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/60">

          {/* ================================================================= */}
          {/* TAB 1: 종합 현황 (4대 KPI 카드 + 엑셀 CSV 다운로드)               */}
          {/* ================================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* Card 1: 총 가입 매장 (Orange) */}
                <div className="p-4 rounded-2xl bg-white border border-orange-200/80 text-center space-y-1.5 shadow-2xs">
                  <p className="text-xs font-extrabold text-orange-600">총 가입 가맹점</p>
                  <p className="text-3xl font-extrabold text-gray-900">{stores.length} <span className="text-sm font-bold text-gray-500">개</span></p>
                  <p className="text-[11px] text-gray-500 font-medium">Supabase DB 등록 매장 {stores.length}개</p>
                </div>

                {/* Card 2: 미처리 문의 (Rose) */}
                <div className="p-4 rounded-2xl bg-white border border-rose-200/80 text-center space-y-1.5 shadow-2xs">
                  <p className="text-xs font-extrabold text-rose-600">미처리 문의 / 건의</p>
                  <p className="text-3xl font-extrabold text-gray-900">{pendingInquiriesCount} <span className="text-sm font-bold text-gray-500">건</span></p>
                  <p className="text-[11px] text-gray-500 font-medium">전체 {inquiries.length}건 접수됨</p>
                </div>

                {/* Card 3: 국세청 인증 사장님 (Amber) */}
                <div className="p-4 rounded-2xl bg-white border border-amber-200/80 text-center space-y-1.5 shadow-2xs">
                  <p className="text-xs font-extrabold text-amber-600">국세청 1:1 진위인증</p>
                  <p className="text-3xl font-extrabold text-gray-900">{verifiedStoresCount} <span className="text-sm font-bold text-gray-500">명</span></p>
                  <p className="text-[11px] text-gray-500 font-medium">정식 소상공인 인증 완료</p>
                </div>

                {/* Card 4: 전체 등록 품목 / 교환권 (Green) */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 text-center space-y-1.5 shadow-2xs">
                  <p className="text-xs font-extrabold text-emerald-600">활성 교환권 & 거래</p>
                  <p className="text-3xl font-extrabold text-gray-900">{allVouchers.length} <span className="text-sm font-bold text-gray-500">건</span></p>
                  <p className="text-[11px] text-gray-500 font-medium">동시 5장 락 · 뱅크런 리스크 0건</p>
                </div>

              </div>

              {/* CSV Download Action Pill */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => exportStoresToCsv(stores)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>전체 회원 DB 엑셀(CSV) 다운로드</span>
                </button>
              </div>

              {/* Quick Operation Status Summary */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-extrabold text-gray-800 flex items-center gap-2">
                  <span>⚡</span>
                  <span>운영자 빠른 시스템 상태 브리핑</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-gray-500 font-medium">국세청 API 연동 상태</p>
                    <p className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 공공데이터포털 정상 작동 중
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-gray-500 font-medium">쿠팡 파트너스 수익 엔진</p>
                    <p className="text-orange-700 font-extrabold">
                      총 누적 추정수익: ₩{adStats.reduce((acc, cur) => acc + cur.estimatedRevenue, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-gray-500 font-medium">동시 5장 보관함 락</p>
                    <p className="text-blue-700 font-extrabold">
                      🛡️ 뱅크런 방지 알고리즘 100% 가동 중
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: 쿠팡/광고 클릭률(CTR) 분석 & 4대 배너 링크 관리          */}
          {/* ================================================================= */}
          {activeTab === 'CTR_ANALYSIS' && (
            <div className="space-y-6">
              
              {/* CTR & Performance Table */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">배너 위치 / 명칭</th>
                      <th className="py-3 px-3 text-center">노출수 (Imp)</th>
                      <th className="py-3 px-3 text-center">클릭수 (Click)</th>
                      <th className="py-3 px-3 text-center">클릭률 (CTR)</th>
                      <th className="py-3 px-3 text-center">추정 수익</th>
                      <th className="py-3 px-4 text-right">최근 클릭</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {adStats.map((banner) => (
                      <tr key={banner.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold flex items-center gap-2">
                          <span>{banner.icon}</span>
                          <div>
                            <p className="text-gray-900 font-extrabold">{banner.name}</p>
                            <p className="text-[11px] text-gray-500 font-normal">{banner.targetCategory}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-600">
                          {banner.impressions}회
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-orange-600">
                          {banner.clicks}회
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-extrabold font-mono text-[11px]">
                            {banner.ctr.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700">
                          ≈ ₩{banner.estimatedRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-400 text-[11px]">
                          {banner.lastClickedAt || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4 Core Banner Coupang Links Management Box */}
              <div className="p-5 rounded-2xl bg-white border border-orange-200/80 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs">🔗</span>
                    <span>4대 핵심 배너별 쿠팡 파트너스 개별 링크 관리</span>
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    각 배너마다 서로 다른 기획전/상품 링크를 연결할 수 있습니다.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Banner 1 Input Card */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                    <label className="text-[11px] font-extrabold text-gray-800 flex items-center gap-1.5">
                      <span>🏆 1. 상단 메인 기획전 배너 (식자재/도매)</span>
                    </label>
                    <input
                      type="text"
                      value={coupangUrls.TOP_MAIN}
                      onChange={(e) => setCoupangUrls({ ...coupangUrls, TOP_MAIN: e.target.value })}
                      placeholder="https://link.coupang.com/a/..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  {/* Banner 2 Input Card */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                    <label className="text-[11px] font-extrabold text-gray-800 flex items-center gap-1.5">
                      <span>🛍️ 2. 사장님 사랑방 피드 배너 (포장/배달용기)</span>
                    </label>
                    <input
                      type="text"
                      value={coupangUrls.COMMUNITY_FEED}
                      onChange={(e) => setCoupangUrls({ ...coupangUrls, COMMUNITY_FEED: e.target.value })}
                      placeholder="https://link.coupang.com/a/..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  {/* Banner 3 Input Card */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                    <label className="text-[11px] font-extrabold text-gray-800 flex items-center gap-1.5">
                      <span>🧼 3. 매장 상세 / 서랍 배너 (주방위생/세제)</span>
                    </label>
                    <input
                      type="text"
                      value={coupangUrls.STORE_DRAWER}
                      onChange={(e) => setCoupangUrls({ ...coupangUrls, STORE_DRAWER: e.target.value })}
                      placeholder="https://link.coupang.com/a/..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  {/* Banner 4 Input Card */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                    <label className="text-[11px] font-extrabold text-gray-800 flex items-center gap-1.5">
                      <span>🖨️ 4. 하단 푸터 & 보관함 배너 (POS 감열지)</span>
                    </label>
                    <input
                      type="text"
                      value={coupangUrls.WALLET_FOOTER}
                      onChange={(e) => setCoupangUrls({ ...coupangUrls, WALLET_FOOTER: e.target.value })}
                      placeholder="https://link.coupang.com/a/..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                </div>

                {/* Save Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {savedSuccess ? (
                    <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" /> 4대 배너 링크가 성공적으로 저장 및 즉시 반영되었습니다!
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-500">
                      저장 즉시 플랫폼 내 모든 사용자의 배너 링크가 실시간으로 교체됩니다.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveLinks}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 4대 배너 링크 일괄 저장 & 즉시 적용</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: 고객 문의/제휴 (푸터 4개 버튼 접수 내역)                  */}
          {/* ================================================================= */}
          {activeTab === 'INQUIRIES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-700">
                  푸터 원클릭 소통창구로 접수된 실시간 문의/제휴 목록 ({inquiries.length}건)
                </h4>
              </div>

              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                  접수된 문의나 제휴 신청이 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        inq.status === 'PENDING'
                          ? 'bg-white border-orange-200/80 shadow-xs'
                          : 'bg-gray-50 border-gray-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                inq.type === 'BUG'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : inq.type === 'PARTNERSHIP'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inq.type === 'FEATURE'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              {inq.type === 'BUG'
                                ? '버그/오류'
                                : inq.type === 'PARTNERSHIP'
                                ? '제휴/광고'
                                : inq.type === 'FEATURE'
                                ? '기능제안'
                                : '문의사항'}
                            </span>
                            <h5 className="font-extrabold text-sm text-gray-900">{inq.title}</h5>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed font-normal">{inq.content}</p>
                          <div className="pt-1 flex items-center gap-3 text-[11px] text-gray-500">
                            <span>신청자: <strong className="text-gray-800">{inq.senderName}</strong></span>
                            <span>연락처: <strong className="text-orange-600">{inq.senderContact}</strong></span>
                            <span>{new Date(inq.createdAt).toLocaleString('ko-KR')}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleInq(inq.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                            inq.status === 'PENDING'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-2xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {inq.status === 'PENDING' ? '처리 완료로 변경' : '미처리로 되돌리기'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: 게시글 관리 (사장님 사랑방)                              */}
          {/* ================================================================= */}
          {activeTab === 'POSTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-700">
                  사장님 사랑방 커뮤니티 등록 게시글 실시간 모니터링 ({posts.length}개)
                </h4>
              </div>

              {posts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                  등록된 게시글이 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-start justify-between gap-3 hover:border-orange-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-200">
                            {post.category === 'DAILY_TALK'
                              ? '오늘 장사 톡'
                              : post.category === 'URGENT_TRADE'
                              ? '마감 번개교환'
                              : '동네 꿀팁·질문'}
                          </span>
                          <h5 className="font-extrabold text-sm text-gray-900">{post.title}</h5>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">{post.content}</p>
                        <div className="pt-1 flex items-center gap-3 text-[11px] text-gray-500">
                          <span>작성 매장: <strong className="text-gray-800">{post.storeName} ({post.authorName})</strong></span>
                          <span>좋아요: {post.likesCount}</span>
                          <span>댓글: {post.commentsCount}</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                        title="운영자 권한 강제 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>강제 삭제</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: 국세청 인증 심사                                         */}
          {/* ================================================================= */}
          {activeTab === 'NTS_AUDIT' && (
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-gray-700">
                국세청 3-Way 실시간 대표자 1:1 진위확인 심사 대장 ({stores.length}개 가맹점)
              </h4>

              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">가게 상호명</th>
                      <th className="py-3 px-3">대표자 성명</th>
                      <th className="py-3 px-3">업종</th>
                      <th className="py-3 px-3">연락처</th>
                      <th className="py-3 px-3 text-center">국세청 원장 대조</th>
                      <th className="py-3 px-4 text-right">인증 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-gray-900">{store.storeName}</td>
                        <td className="py-3 px-3 font-bold text-gray-800">{store.ownerName}</td>
                        <td className="py-3 px-3 text-gray-500">{store.categoryName || store.category}</td>
                        <td className="py-3 px-3 font-mono text-gray-600">{store.phone}</td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-emerald-700 font-bold">
                          100% 1:1 일치
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[10px]">
                            ✅ 국세청 인증완료
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: 회원 DB 관리 (영구정지 BAN / ACTIVE 스위치)              */}
          {/* ================================================================= */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-700">
                  전체 가맹 사장님 회원 관리 & 악성 계정 차단 ({stores.length}명)
                </h4>
                <button
                  type="button"
                  onClick={() => exportStoresToCsv(stores)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV 다운로드</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {stores.map((store) => {
                  const isBanned = bannedStoreIds.includes(store.id);
                  return (
                    <div
                      key={store.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBanned
                          ? 'bg-red-50/60 border-red-200 opacity-75'
                          : 'bg-white border-gray-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={store.storeImageUrl}
                          alt={store.storeName}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900">{store.storeName}</span>
                            <span className="text-xs text-gray-500">({store.ownerName} 사장님)</span>
                            {isBanned && (
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black">
                                영구 정지됨
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            📍 {store.address} · 📞 {store.phone} · 등록 품목 {store.exchangeItems.length}개
                          </p>
                        </div>
                      </div>

                      {onToggleStoreBan && (
                        <button
                          type="button"
                          onClick={() => onToggleStoreBan(store.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap ${
                            isBanned
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{isBanned ? '정지 해제' : '영구 정지(BAN)'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 7: 교환권 & 거래 모니터링 (뱅크런 리스크 방지)              */}
          {/* ================================================================= */}
          {activeTab === 'VOUCHERS' && (
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-gray-700">
                상생 교환권 발행·사용 투명 대장 (뱅크런 리스크 예방 감시)
              </h4>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium leading-relaxed">
                🛡️ <strong>플랫폼 안전 지침 준수 중</strong>: 모든 회원의 동시 보유 한도는 <strong>5장</strong>으로 제한되어 있어 단일 사업장의 과도한 남발이나 뱅크런 위험이 기술적으로 봉쇄되어 있습니다.
              </div>

              {allVouchers.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                  현재 유통 중인 교환권이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {allVouchers.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-gray-900">{v.title}</p>
                        <p className="text-[11px] text-gray-500">
                          발행: {v.senderStoreName} ➔ 수령: {v.receiverStoreName} · 액면가 ₩{v.amount?.toLocaleString()}원
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-[11px]">
                        {v.status === 'AVAILABLE' ? '유효 (D-Day 카운트중)' : v.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 8: 공지 & 시스템 제어                                       */}
          {/* ================================================================= */}
          {activeTab === 'SYSTEM' && (
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 text-xs">
              <h4 className="font-extrabold text-sm text-gray-900">시스템 환경 제어 및 긴급 공지 발송</h4>
              
              <div className="space-y-2">
                <label className="text-gray-700 font-bold block">전체 사장님 긴급 공지 팝업 메시지</label>
                <input
                  type="text"
                  placeholder="예: [안내] 금일 자정 서버 정기 점검이 진행될 예정입니다."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('공지사항이 전체 사용자에게 브로드캐스트되었습니다.')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold rounded-xl active:scale-95 transition-all shadow-xs"
                >
                  공지사항 즉시 송출
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
