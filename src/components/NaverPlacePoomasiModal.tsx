import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  RotateCcw,
  Sparkles,
  Store as StoreIcon,
  ShieldCheck,
  HelpCircle,
  Copy,
  Clock,
  ThumbsUp,
  Inbox,
  Lock,
  MessageSquare
} from 'lucide-react';
import { Store, NaverPlacePoomasiStore, NaverPlacePoomasiRequest } from '../types/trade';
import {
  fetchPoomasiStores,
  fetchMyPoomasiStore,
  registerPoomasiStore,
  unregisterPoomasiStore,
  sendPoomasiRequest,
  fetchIncomingPoomasiRequests,
  completePoomasiRequest,
  reportPoomasiRequest,
} from '../lib/supabase';

interface NaverPlacePoomasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  isLoggedIn: boolean;
  onOpenAuthModal: () => void;
  onOpenInquiry?: (props: { defaultType: 'INQUIRY'; defaultTitle: string; defaultContent: string }) => void;
}

export const NaverPlacePoomasiModal: React.FC<NaverPlacePoomasiModalProps> = ({
  isOpen,
  onClose,
  myStore,
  isLoggedIn,
  onOpenAuthModal,
  onOpenInquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'INCOMING'>('FEED');
  const [stores, setStores] = useState<NaverPlacePoomasiStore[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<NaverPlacePoomasiRequest[]>([]);
  const [myPoomasi, setMyPoomasi] = useState<NaverPlacePoomasiStore | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [placeUrlInput, setPlaceUrlInput] = useState('');
  const [messageInput, setMessageInput] = useState('확인 즉시 100% 맞저장 달려갑니다!');
  const [regLoading, setRegLoading] = useState(false);

  // Visited state tracker for buttons (storeId -> boolean)
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});
  const [requestSendingId, setRequestSendingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedStores, myStatus, requests] = await Promise.all([
        fetchPoomasiStores(),
        myStore?.id ? fetchMyPoomasiStore(myStore.id) : Promise.resolve(null),
        myStore?.id ? fetchIncomingPoomasiRequests(myStore.id) : Promise.resolve([]),
      ]);

      setStores(fetchedStores || []);
      setMyPoomasi(myStatus);
      setIncomingRequests(requests || []);

      if (myStatus?.placeUrl) {
        setPlaceUrlInput(myStatus.placeUrl);
      }
      if (myStatus?.message) {
        setMessageInput(myStatus.message);
      }
    } catch (err) {
      console.error('[Poomasi Modal] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, myStore?.id]);

  if (!isOpen) return null;

  // 🔔 팝업 차단 방지용 안전한 링크 열기 (에러 시 클립보드 복사 폴백)
  const handleSafeOpenUrl = (url: string, storeName: string) => {
    if (!url) {
      alert('네이버 플레이스 링크가 등록되지 않은 매장입니다.');
      return;
    }

    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // 브라우저 팝업 차단 발생 시 클립보드 복사
        navigator.clipboard.writeText(url).then(() => {
          alert(`💡 팝업이 차단되었습니다.\n[${storeName}] 플레이스 링크가 클립보드에 복사되었으니 새 탭에 붙여넣어 이동해 주세요!`);
        });
      }
    } catch (e) {
      navigator.clipboard.writeText(url);
      alert(`[${storeName}] 플레이스 주소가 복사되었습니다. 브라우저 새 창에서 열어주세요.`);
    }
  };

  // 내 가게 등록/수정 제출
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    if (!placeUrlInput.trim()) {
      alert('우리 가게 네이버 플레이스 링크(URL)를 입력해 주세요.');
      return;
    }

    if (!placeUrlInput.includes('naver.com') && !placeUrlInput.includes('naver.me')) {
      alert('올바른 네이버 플레이스 링크를 입력해 주세요.\n(예: https://naver.me/xxx 또는 https://m.place.naver.com/...)');
      return;
    }

    setRegLoading(true);
    const res = await registerPoomasiStore(myStore, placeUrlInput.trim(), messageInput.trim());
    setRegLoading(false);

    if (res.success && res.data) {
      setMyPoomasi(res.data);
      setIsRegisterOpen(false);
      setActionSuccessMsg('🎉 우리 가게 플레이스 품앗이 등록이 완료되었습니다!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadData();
    } else {
      alert(res.error || '등록 중 오류가 발생했습니다.');
    }
  };

  // 맞저장 요청 전송 (1. 링크 열기 후 2. 요청 전송)
  const handleSendRequest = async (targetStore: NaverPlacePoomasiStore) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    // 내 플레이스 등록 여부 확인
    if (!myPoomasi?.placeUrl) {
      alert('상대 사장님이 맞저장할 수 있도록 먼저 [우리 가게 품앗이 등록]을 완료해 주세요!');
      setIsRegisterOpen(true);
      return;
    }

    const confirmed = window.confirm(
      `[${targetStore.storeName}] 네이버 플레이스에 '저장(★)'을 누르셨나요?\n\n상대 사장님께 알림과 함께 맞저장 요청을 보냅니다.`
    );
    if (!confirmed) return;

    setRequestSendingId(targetStore.id);
    const res = await sendPoomasiRequest(myStore, myPoomasi.placeUrl, targetStore);
    setRequestSendingId(null);

    if (res.success) {
      setActionSuccessMsg(`✅ [${targetStore.storeName}] 사장님께 맞저장 요청을 보냈습니다!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadData();
    } else {
      alert(res.error || '요청 전송에 실패했습니다.');
    }
  };

  // 맞저장 완료 처리
  const handleCompleteRequest = async (request: NaverPlacePoomasiRequest) => {
    const confirmed = window.confirm(
      `[${request.fromStoreName}] 사장님의 네이버 플레이스에 맞저장을 누르셨나요?\n\n맞저장 완료로 상태를 변경합니다.`
    );
    if (!confirmed) return;

    const ok = await completePoomasiRequest(request.id, request.fromStoreId);
    if (ok) {
      setActionSuccessMsg(`🤝 [${request.fromStoreName}] 맞저장이 완료되었습니다. 상생 품앗이 성공!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadData();
    }
  };

  // 미저장 신고 처리 (3회 누적 시 차단)
  const handleReportRequest = async (request: NaverPlacePoomasiRequest) => {
    const confirmed = window.confirm(
      `[${request.fromStoreName}] 사장님이 실제로 저장을 누르지 않았나요?\n\n⚠️ 허위 신고 시 불이익을 받을 수 있으며, 상대 회원에게 경고가 1회 부여됩니다. (누적 3회 시 영구 차단)\n\n정말 신고하시겠습니까?`
    );
    if (!confirmed) return;

    const res = await reportPoomasiRequest(
      request.id,
      request.fromStoreId,
      myStore.storeName,
      '미저장 의심 신고'
    );

    if (res.success) {
      if (res.isBlocked) {
        alert(`🚨 신고가 접수되었습니다.\n상대 회원의 누적 경고가 3회에 도달하여 플레이스 품앗이 이용이 즉시 자동 차단되었습니다.`);
      } else {
        alert(`신고가 접수되었습니다.\n(해당 회원 누적 경고: ${res.newWarningCount}/3회)`);
      }
      loadData();
    }
  };

  // 🚨 3회 경고 차단 여부 검사
  const isBlockedUser = Boolean(myPoomasi?.isBlocked || (myPoomasi?.warningCount || 0) >= 3);

  const pendingRequestsCount = incomingRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header: Naver Signature Emerald */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                    네이버 플레이스 저장 품앗이
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                    100% 자발적 상생
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  원하시는 사장님들끼리 서로 네이버 저장(북마크)을 눌러 순위를 올립니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Menu */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/20">
            <button
              type="button"
              onClick={() => setActiveTab('FEED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'FEED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>이웃 가게 저장하기 ({stores.filter((s) => s.id !== myStore.id).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INCOMING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
                activeTab === 'INCOMING'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>나에게 온 맞저장 요청</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Success Notification Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
          
          {/* 🚨 1. 경고 3회 누적으로 차단된 유저인 경우의 에러 화면 */}
          {isBlockedUser ? (
            <div className="bg-white rounded-3xl border-2 border-red-200 p-6 text-center space-y-4 shadow-sm animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto border border-red-200">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white">
                  경고 3회 누적 제재
                </span>
                <h3 className="font-black text-lg text-gray-900 tracking-tight">
                  플레이스 저장 품앗이 이용이 제한되었습니다
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed break-keep">
                  다른 사장님들로부터 <strong>미저장 신고가 3회 누적</strong>되어, 신뢰할 수 있는 상생 품앗이 생태계 유지를 위해 해당 계정의 기능이 자동 차단되었습니다.
                </p>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-left text-xs text-amber-950 space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>억울하시거나 사실과 다른 신고로 제재되셨나요?</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed break-keep">
                  실제로 저장을 누르셨으나 오해로 신고된 경우, 관리자에게 문의사항(소명)을 남겨주시면 저장 기록 확인 후 즉시 제재를 해제해 드립니다.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenInquiry) {
                      onOpenInquiry({
                        defaultType: 'INQUIRY',
                        defaultTitle: `[플레이스 품앗이 이용제한 소명] ${myStore.storeName}`,
                        defaultContent: `안녕하세요, ${myStore.storeName} (${myStore.ownerName}) 사장입니다.\n\n미저장 신고 3회 누적으로 플레이스 품앗이 기능이 제한되었습니다.\n오해이거나 사실과 다른 신고가 포함되어 있어 소명 및 차단 해제를 요청드립니다.\n\n확인 부탁드립니다.`,
                      });
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>관리자에게 소명 문의 남기기</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 탭 ①: 이웃 가게 저장하기 (피드) */}
              {activeTab === 'FEED' && (
                <div className="space-y-4">
                  
                  {/* 내 매장 품앗이 참여 상태 바 / 등록 폼 */}
                  <div className="bg-white rounded-2xl border-2 border-emerald-100 p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏬</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                            <span>우리 가게 플레이스 품앗이 참여 상태</span>
                            {myPoomasi?.placeUrl ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🟢 참여 중
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                ⚪ 미참여
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {myPoomasi?.placeUrl
                              ? `받은 저장: ${myPoomasi.saveCount || 0}회 · 경고: ${myPoomasi.warningCount || 0}/3회`
                              : '링크를 등록하시면 다른 사장님들이 우리 가게를 저장하고 맞저장을 요청합니다.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {myPoomasi?.placeUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                              {isRegisterOpen ? '접기' : '링크·각오 수정'}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('품앗이 목록에서 우리 가게를 내리시겠습니까?')) {
                                  await unregisterPoomasiStore(myStore.id);
                                  loadData();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                            >
                              참여 중단
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsRegisterOpen(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>우리 가게 등록하기</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 등록/수정 접이식 폼 */}
                    {isRegisterOpen && (
                      <form onSubmit={handleRegisterSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-in fade-in">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            우리 가게 네이버 플레이스 링크 (URL) <span className="text-emerald-600">*</span>
                          </label>
                          <input
                            type="url"
                            required
                            value={placeUrlInput}
                            onChange={(e) => setPlaceUrlInput(e.target.value)}
                            placeholder="예: https://naver.me/5vI9xxxx 또는 https://m.place.naver.com/restaurant/..."
                            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <span>💡 네이버 지도 앱에서 우리 매장 검색 &gt; [공유] &gt; [링크 복사] 후 붙여넣으세요.</span>
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            사장님 한마디 & 맞저장 약속 (최대 50자)
                          </label>
                          <input
                            type="text"
                            maxLength={50}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="예: 확인 즉시 100% 맞저장 달려갑니다!"
                            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsRegisterOpen(false)}
                            className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={regLoading}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {regLoading ? '저장 중...' : '품앗이 등록 완료'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* 이웃 매장 목록 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 font-bold px-1">
                      <span>품앗이 참여 이웃 매장 ({stores.filter((s) => s.id !== myStore.id).length}곳)</span>
                      <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="text-[11px] text-gray-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>새로고침</span>
                      </button>
                    </div>

                    {stores.filter((s) => s.id !== myStore.id).length === 0 ? (
                      <div className="py-12 bg-white rounded-3xl border border-gray-200 text-center space-y-2 p-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto">
                          🌱
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-800">
                          아직 등록된 이웃 매장이 없습니다
                        </h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto break-keep">
                          사장님이 첫 번째로 우리 가게 플레이스 링크를 등록해 보세요! 다른 사장님들이 모여들기 시작합니다.
                        </p>
                      </div>
                    ) : (
                      stores
                        .filter((s) => s.id !== myStore.id)
                        .map((targetStore) => {
                          const hasVisited = Boolean(visitedMap[targetStore.id]);
                          const isSending = requestSendingId === targetStore.id;

                          return (
                            <div
                              key={targetStore.id}
                              className="bg-white rounded-2xl border-2 border-gray-200/90 hover:border-emerald-300 shadow-sm p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                            >
                              {/* Store Basic Info */}
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                  <img
                                    src={
                                      targetStore.storeImageUrl ||
                                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80'
                                    }
                                    alt={targetStore.storeName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      {targetStore.categoryName || '외식업'}
                                    </span>
                                    <h4 className="font-extrabold text-sm text-gray-950 truncate">
                                      {targetStore.storeName}
                                    </h4>
                                    <span className="text-xs text-gray-500 font-medium">
                                      ({targetStore.ownerName} 사장님)
                                    </span>
                                  </div>
                                  <p className="text-xs text-emerald-950 bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1 mt-1.5 leading-snug font-medium break-keep">
                                    “{targetStore.message}”
                                  </p>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    📍 {targetStore.address} · 누적 저장 {targetStore.saveCount || 0}회
                                  </p>
                                </div>
                              </div>

                              {/* 2-Step Action Buttons */}
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                {/* 1. 네이버 열기 */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSafeOpenUrl(targetStore.placeUrl, targetStore.storeName);
                                    setVisitedMap((prev) => ({ ...prev, [targetStore.id]: true }));
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                  title="새 창으로 네이버 플레이스 열기"
                                >
                                  <span>🔗 1. 네이버 저장 열기</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {/* 2. 저장 완료 & 맞저장 요청 */}
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() => handleSendRequest(targetStore)}
                                  className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs ${
                                    hasVisited
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                                      : 'bg-gray-900 hover:bg-black text-white'
                                  }`}
                                >
                                  <span>{isSending ? '전송 중...' : '✅ 2. 저장 완료 & 맞저장 요청'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* 탭 ②: 나에게 온 맞저장 요청함 */}
              {activeTab === 'INCOMING' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 font-bold px-1">
                    <span>나에게 들어온 맞저장 요청 ({incomingRequests.length}건)</span>
                    <button
                      type="button"
                      onClick={loadData}
                      disabled={loading}
                      className="text-[11px] text-gray-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      <span>새로고침</span>
                    </button>
                  </div>

                  {incomingRequests.length === 0 ? (
                    <div className="py-12 bg-white rounded-3xl border border-gray-200 text-center space-y-2 p-6">
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xl mx-auto">
                        📬
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-800">
                        아직 도착한 맞저장 요청이 없습니다
                      </h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto break-keep">
                        우리 매장 링크를 등록하고 먼저 이웃 사장님들의 플레이스를 저장해 보세요! 사장님들이 바로 맞저장하러 찾아옵니다.
                      </p>
                    </div>
                  ) : (
                    incomingRequests.map((req) => {
                      const isPending = req.status === 'PENDING';
                      const isCompleted = req.status === 'COMPLETED';
                      const isReported = req.status === 'REPORTED';

                      return (
                        <div
                          key={req.id}
                          className={`rounded-2xl border p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isCompleted
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : isReported
                              ? 'bg-red-50/50 border-red-200 opacity-80'
                              : 'bg-white border-gray-300 shadow-sm'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>맞저장 대기 중</span>
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>맞저장 완료</span>
                                </span>
                              )}
                              {isReported && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>미저장 신고됨</span>
                                </span>
                              )}
                              <span className="text-[11px] text-gray-400">
                                {new Date(req.createdAt).toLocaleString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <h4 className="font-black text-sm text-gray-900">
                              [{req.fromStoreName}] 사장님이 내 가게를 저장했습니다!
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {req.fromOwnerName} 사장님께 맞저장으로 화답해 주세요.
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            {isPending && (
                              <>
                                {/* 1. 상대방 플레이스 열기 */}
                                <button
                                  type="button"
                                  onClick={() => handleSafeOpenUrl(req.fromPlaceUrl, req.fromStoreName)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                >
                                  <span>👉 맞저장하러 가기</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {/* 2. 맞저장 완료 */}
                                <button
                                  type="button"
                                  onClick={() => handleCompleteRequest(req)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
                                >
                                  <span>🤝 맞저장 완료</span>
                                </button>

                                {/* 3. 미저장 신고 (경고 부여) */}
                                <button
                                  type="button"
                                  onClick={() => handleReportRequest(req)}
                                  className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                  title="실제로 저장을 누르지 않은 경우 신고합니다 (경고 부여)"
                                >
                                  <span>🚨 미저장 신고</span>
                                </button>
                              </>
                            )}

                            {isCompleted && (
                              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>상호 맞저장 완료됨</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>상호 신뢰 기반 품앗이 (미저장 신고 3회 누적 시 이용이 영구 제한됩니다)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
