import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, RefreshCw, Sparkles, Inbox, Send, Trash2, Phone, ExternalLink } from 'lucide-react';
import { TradeProposal, Store, MenuTestApplication, MenuTestFeedbackType } from '../types/trade';
import {
  fetchTradeProposalsFromSupabase,
  updateTradeProposalStatus,
  deleteTradeProposal,
  fetchStoredVouchers,
  issueBilateralVouchersForTrade,
  subscribeToTradeProposals,
  fetchMyMenuTestApplications,
  cancelMenuTestApplication
} from '../lib/supabase';

export type DashboardTab = 'RECEIVED' | 'SENT' | 'MY_APPLICATIONS';

interface TradeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  allStores: Store[];
  onAcceptAndOpenChat: (proposal: TradeProposal) => void;
  onOpenChat: (store: Store) => void;
  initialTab?: DashboardTab;
}

export const TradeDashboardModal: React.FC<TradeDashboardModalProps> = ({
  isOpen,
  onClose,
  myStore,
  allStores,
  onAcceptAndOpenChat,
  onOpenChat,
  initialTab = 'RECEIVED',
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [myApplications, setMyApplications] = useState<MenuTestApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [proposalsData, appsData] = await Promise.all([
      fetchTradeProposalsFromSupabase(myStore.id),
      fetchMyMenuTestApplications(myStore.id, myStore.storeName)
    ]);
    setProposals(proposalsData);
    setMyApplications(appsData);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      loadData();
      const unsubscribe = subscribeToTradeProposals(myStore.id, () => {
        loadData();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, myStore.id, initialTab]);

  if (!isOpen) return null;

  const receivedProposals = proposals.filter(
    (p) => p.targetStoreId === myStore.id || p.targetStoreId === 'my-store' || (!p.targetStoreId && p.myStoreId !== myStore.id)
  );
  const sentProposals = proposals.filter((p) => p.myStoreId === myStore.id);

  const handleStatusChange = async (proposal: TradeProposal, newStatus: 'ACCEPTED' | 'REJECTED') => {
    setActionLoadingId(proposal.id);

    if (newStatus === 'ACCEPTED') {
      const activeVouchers = fetchStoredVouchers(myStore.id).filter((v) => v.status === 'AVAILABLE');
      if (activeVouchers.length >= 5) {
        alert('⚠️ 현재 사장님의 교환권 보관함이 가득 찼습니다 (최대 5장).\n새 교환권을 수령하시려면 기존 교환권을 먼저 사용 완료해 주세요.');
        setActionLoadingId(null);
        return;
      }

      // Bilateral simultaneous auto-issuance into both wallets
      const issueRes = issueBilateralVouchersForTrade(proposal, myStore.id);
      if (!issueRes.success) {
        alert(issueRes.error || '교환권 발급 중 오류가 발생했습니다.');
        setActionLoadingId(null);
        return;
      }
    }

    await updateTradeProposalStatus(proposal.id, newStatus);

    setProposals((prev) =>
      prev.map((item) => (item.id === proposal.id ? { ...item, status: newStatus } : item))
    );
    setActionLoadingId(null);

    if (newStatus === 'ACCEPTED') {
      alert(
        `🎉 1:1 물물교환 제안을 수락했습니다!\n🎟️ 양측 매장의 상생 교환권이 보관함으로 상호 즉시 자동 발급되었습니다! (30일 유효)\n대화방 및 [내 교환권 보관함]에서 쿠폰을 바로 확인하실 수 있습니다.`
      );
      onAcceptAndOpenChat(proposal);
      onClose();
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('이 물물교환 제안 내역을 삭제하시겠습니까?')) return;
    await deleteTradeProposal(proposalId);
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  };

  const handleCancelApplication = async (app: MenuTestApplication) => {
    const isPending = app.status === 'PENDING';
    const confirmMsg = isPending
      ? `[${app.campaignTitle || '신메뉴 시식단'}] 신청을 취소하시겠습니까?\n사장님께 전달된 지원서가 즉시 회수됩니다.`
      : `이 신청 내역을 목록에서 삭제하시겠습니까?`;
    if (!confirm(confirmMsg)) return;

    setCancelLoadingId(app.id);
    const res = await cancelMenuTestApplication(app.id, app.storeId);
    if (res.success) {
      setMyApplications((prev) => prev.filter((item) => item.id !== app.id));
      alert(isPending ? '신메뉴 시식단 신청이 성공적으로 취소되었습니다.' : '신청 내역이 삭제되었습니다.');
    } else {
      alert('처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
    setCancelLoadingId(null);
  };

  const getFeedbackBadge = (type?: MenuTestFeedbackType) => {
    switch (type) {
      case 'BLOG_SNS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">📱 SNS / 블로그 후기</span>;
      case 'SECRET_REPORT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">🔒 1:1 비밀 피드백 리포트</span>;
      case 'BOTH':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap">🌟 SNS 후기 + 비밀 피드백</span>;
    }
  };

  const currentList = activeTab === 'RECEIVED' ? receivedProposals : sentProposals;
  const pendingReceivedCount = receivedProposals.filter((p) => p.status === 'PENDING').length;
  const pendingApplicationsCount = myApplications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 p-3.5 sm:p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center text-base sm:text-lg shadow-inner flex-shrink-0">
                🔄
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                    1:1 물물교환 & 시식단 신청함
                  </h2>
                  {(pendingReceivedCount > 0 || pendingApplicationsCount > 0) && (
                    <span className="px-2 py-0.5 bg-white text-orange-700 font-extrabold text-[10px] rounded-full shadow-sm whitespace-nowrap">
                      {pendingReceivedCount > 0 ? `새 제안 ${pendingReceivedCount}건` : `신청 검토중 ${pendingApplicationsCount}건`}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-orange-100 truncate">
                  {myStore.storeName} ({myStore.ownerName} 사장님)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg text-orange-100 hover:text-white hover:bg-white/20 transition-all"
                title="새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-orange-100 hover:text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selector (3 Responsive Tabs) */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`flex-1 min-w-[100px] py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border-b-2 transition-all whitespace-nowrap px-2 ${
              activeTab === 'RECEIVED'
                ? 'border-orange-500 text-orange-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 flex-shrink-0" />
            <span>받은 제안 ({receivedProposals.length})</span>
            {pendingReceivedCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`flex-1 min-w-[100px] py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border-b-2 transition-all whitespace-nowrap px-2 ${
              activeTab === 'SENT'
                ? 'border-orange-500 text-orange-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Send className="w-3.5 h-3.5 flex-shrink-0" />
            <span>보낸 찔러보기 ({sentProposals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MY_APPLICATIONS')}
            className={`flex-1 min-w-[110px] py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border-b-2 transition-all whitespace-nowrap px-2 ${
              activeTab === 'MY_APPLICATIONS'
                ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-purple-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xs">🧪</span>
            <span>신청한 시식단 ({myApplications.length})</span>
            {pendingApplicationsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
          {activeTab === 'MY_APPLICATIONS' ? (
            loading && myApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                신청한 시식단 목록을 불러오는 중입니다...
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                <div className="text-3xl">🧪</div>
                <p className="font-bold text-gray-700">아직 신청한 신메뉴 시식단이 없습니다.</p>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                  지도에서 <strong>[🧪 신메뉴 시식단]</strong> 태그가 붙은 이웃 매장들을 둘러보고 솔직한 후기 시식단에 신청해 보세요!
                </p>
              </div>
            ) : (
              myApplications.map((app) => {
                const targetStore = allStores.find((s) => s.id === app.storeId);
                const targetStoreName = targetStore?.storeName || app.applicantStoreName || '이웃 매장';
                const targetOwnerName = targetStore?.ownerName || '사장님';
                const campaignTitle = app.campaignTitle || targetStore?.menuTestTitle || '신메뉴 시식단';
                const reward = targetStore?.menuTestReward || '신메뉴 무료 시식';

                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-sm transition-all space-y-3 ${
                      app.status === 'ACCEPTED'
                        ? 'border-emerald-300 ring-2 ring-emerald-100'
                        : app.status === 'REJECTED'
                        ? 'border-gray-200 opacity-60'
                        : 'border-purple-200 hover:shadow-md'
                    }`}
                  >
                    {/* Card Header: Badges & Store Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                          <span>🧪</span>
                          <span>신메뉴 시식단 신청</span>
                        </span>
                        {getFeedbackBadge(app.feedbackType)}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-extrabold text-gray-900 truncate block">
                            {targetStoreName}{' '}
                            <span className="text-[11px] text-gray-500 font-normal">
                              ({targetOwnerName} 사장님)
                            </span>
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {app.status === 'ACCEPTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>선정 완료</span>
                            </span>
                          ) : app.status === 'REJECTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                              모집 마감
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>선정 검토중</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Campaign Info Box */}
                    <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-100 text-xs space-y-1">
                      <div className="font-extrabold text-purple-950 flex items-center justify-between gap-2">
                        <span className="truncate">📢 {campaignTitle}</span>
                        <span className="text-[10px] text-purple-600 font-normal whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 신청
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-900 font-medium">
                        🎁 무료 혜택: <strong>{reward}</strong>
                      </div>
                    </div>

                    {/* My Message */}
                    <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-800 border border-gray-200 leading-relaxed">
                      <span className="text-[10px] font-bold text-gray-500 block mb-0.5">💬 내가 전달한 각오 / 희망 방문 시간:</span>
                      <p className="font-medium whitespace-pre-wrap">{app.message}</p>
                    </div>

                    {/* SNS Link if provided */}
                    {app.snsUrl && (
                      <div className="bg-white rounded-lg p-2 border border-gray-200 flex items-center justify-between text-xs">
                        <span className="text-gray-500 text-[11px] font-bold">📱 내 SNS/블로그:</span>
                        <a
                          href={app.snsUrl.startsWith('http') ? app.snsUrl : `https://${app.snsUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1 underline truncate max-w-[240px]"
                        >
                          <span>{app.snsUrl}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Friendly Status Notice */}
                    {app.status === 'PENDING' ? (
                      <div className="text-[11px] text-amber-900 bg-amber-50/80 rounded-lg p-2 border border-amber-200/80 flex items-start gap-1.5 leading-snug">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>사장님이 신청서를 확인하고 있습니다. 최종 선정 시 1:1 대화방이 자동으로 열리고 일정을 조율하게 됩니다.</span>
                      </div>
                    ) : app.status === 'ACCEPTED' ? (
                      <div className="text-[11px] text-emerald-900 bg-emerald-50/80 rounded-lg p-2 border border-emerald-200/80 flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>축하합니다! 시식단으로 최종 선정되었습니다. 아래 대화방 버튼을 눌러 편하신 방문 일시와 인원을 조율해 주세요.</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-600 bg-gray-100 rounded-lg p-2 border border-gray-200 flex items-start gap-1.5 leading-snug">
                        <span>🏁 해당 신메뉴 모집 기간이 종료되었습니다. 다른 이웃 매장의 신메뉴에 도전해 보세요!</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap">
                      <div className="text-[11px] text-gray-500">
                        {targetStore?.phone && (
                          <a
                            href={`tel:${targetStore.phone}`}
                            className="hover:text-purple-700 flex items-center gap-1 font-medium whitespace-nowrap"
                          >
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>매장 문의 ({targetStore.phone})</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={cancelLoadingId === app.id}
                            onClick={() => handleCancelApplication(app)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>신청 취소하기</span>
                          </button>
                        ) : app.status === 'ACCEPTED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (targetStore) onOpenChat(targetStore);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>1:1 대화방 열기</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={cancelLoadingId === app.id}
                            onClick={() => handleCancelApplication(app)}
                            className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>내역 삭제</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )
          ) : (
            loading && currentList.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                교환 제안 목록을 불러오는 중입니다...
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                <div className="text-3xl">📭</div>
                <p className="font-bold text-gray-700">
                  {activeTab === 'RECEIVED' ? '아직 받은 교환 제안이 없습니다.' : '보낸 교환 제안이 없습니다.'}
                </p>
                <p className="text-[11px] text-gray-500">
                  지도에서 이웃 가게 메뉴를 보고 1:1 물물교환 또는 찔러보기를 제안해 보세요!
                </p>
              </div>
            ) : (
              currentList.map((proposal) => {
                const otherStoreName =
                  activeTab === 'RECEIVED'
                    ? proposal.myStoreName || '이웃 매장'
                    : proposal.targetStoreName || '이웃 매장';

                const otherOwnerName =
                  activeTab === 'RECEIVED'
                    ? proposal.myOwnerName || '사장님'
                    : proposal.targetOwnerName || '사장님';

                return (
                  <div
                    key={proposal.id}
                    className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-sm transition-all space-y-3 ${
                      proposal.status === 'ACCEPTED'
                        ? 'border-emerald-300 ring-2 ring-emerald-100'
                        : proposal.status === 'REJECTED'
                        ? 'border-gray-200 opacity-60'
                        : proposal.isPoke
                        ? 'border-indigo-200 hover:shadow-md'
                        : 'border-orange-200 hover:shadow-md'
                    }`}
                  >
                    {/* Card Header: Badges Row + Store & Status Row */}
                    <div className="space-y-2">
                      {/* Badge Row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {proposal.isPoke ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                            <span>👉</span>
                            <span>비동기 찔러보기</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                            <span>⚡</span>
                            <span>실시간 물물교환</span>
                          </span>
                        )}

                        {(proposal.tradeType === 'VOUCHER' ||
                          proposal.tradeFulfillment?.includes('교환권') ||
                          proposal.myItemTitle?.includes('교환권') ||
                          proposal.myItemTitle?.includes('이용권') ||
                          proposal.myItemTitle?.includes('상품권') ||
                          proposal.targetItemTitle?.includes('교환권') ||
                          proposal.targetItemTitle?.includes('이용권') ||
                          proposal.targetItemTitle?.includes('상품권')) && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                            <span>🎟️</span>
                            <span>상생 교환권 맞발행</span>
                          </span>
                        )}
                      </div>

                      {/* Store Title & Status Pill Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-extrabold text-gray-900 truncate block">
                            {otherStoreName}{' '}
                            <span className="text-[11px] text-gray-500 font-normal">
                              ({otherOwnerName})
                            </span>
                          </span>
                        </div>

                        {/* Status Badge & Delete Button */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {proposal.status === 'ACCEPTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>교환 수락됨</span>
                            </span>
                          ) : proposal.status === 'REJECTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                              거절됨
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>수락 대기중</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="제안 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Trade Items Comparison Box */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* My Proposal Item */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 block">
                          {activeTab === 'RECEIVED' ? '상대방이 제안한 품목' : '내가 제안한 내 품목'}
                        </span>
                        <div className="flex items-center gap-2">
                          {proposal.myItemImageUrl && (
                            <img
                              src={proposal.myItemImageUrl}
                              alt={proposal.myItemTitle}
                              className="w-10 h-10 rounded-lg object-cover border flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {proposal.myItemTitle || '교환 품목'}
                            </p>
                            <p className="text-gray-500 text-[11px]">
                              {proposal.myItemPrice ? `${proposal.myItemPrice.toLocaleString()}원 상당` : '금액 미지정'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Target Requested Item */}
                      <div className="space-y-1 sm:border-l sm:border-gray-200 sm:pl-3">
                        <span className="text-[10px] font-bold text-gray-500 block">
                          {activeTab === 'RECEIVED' ? '내 가게 희망 품목' : '상대 매장 희망 품목'}
                        </span>
                        <div className="flex items-center gap-2">
                          {proposal.targetItemImageUrl && (
                            <img
                              src={proposal.targetItemImageUrl}
                              alt={proposal.targetItemTitle}
                              className="w-10 h-10 rounded-lg object-cover border flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {proposal.targetItemTitle || '희망 품목'}
                            </p>
                            <p className="text-gray-500 text-[11px]">
                              {proposal.targetItemPrice ? `${proposal.targetItemPrice.toLocaleString()}원 상당` : '금액 미지정'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proposal Details (Fulfillment & Time) */}
                    <div className="bg-amber-50/50 rounded-xl p-2.5 border border-amber-100 flex items-center justify-between text-xs flex-wrap gap-1">
                      <div className="flex items-center gap-2 text-gray-700">
                        {proposal.tradeFulfillment && (
                          <span className="font-bold text-amber-900">
                            📦 {proposal.tradeFulfillment}
                          </span>
                        )}
                        {proposal.proposedTime && (
                          <span className="text-gray-500 text-[11px]">
                            🕒 {proposal.proposedTime}
                          </span>
                        )}
                      </div>

                      {proposal.priceDifference !== 0 && (
                        <span className={`text-[11px] font-bold ${
                          proposal.priceDifference > 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {proposal.priceDifference > 0
                            ? `정산 차액: +${proposal.priceDifference.toLocaleString()}원`
                            : `정산 차액: ${proposal.priceDifference.toLocaleString()}원`}
                        </span>
                      )}
                    </div>

                    {/* Proposal Message */}
                    {proposal.message && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                        💬 "{proposal.message}"
                      </p>
                    )}

                    {/* Action Buttons (For Received Proposals) */}
                    {activeTab === 'RECEIVED' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 flex-wrap">
                        {proposal.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === proposal.id}
                              onClick={() => handleStatusChange(proposal, 'REJECTED')}
                              className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>거절</span>
                            </button>

                            <button
                              type="button"
                              disabled={actionLoadingId === proposal.id}
                              onClick={() => handleStatusChange(proposal, 'ACCEPTED')}
                              className={`px-3.5 sm:px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
                                proposal.isPoke
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>교환 수락 & 대화방 열기</span>
                            </button>
                          </>
                        ) : proposal.status === 'ACCEPTED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              onAcceptAndOpenChat(proposal);
                              onClose();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>1:1 대화방 열기</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(proposal, 'ACCEPTED')}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600 font-bold text-xs rounded-xl border border-gray-200 transition-all whitespace-nowrap"
                          >
                            수락으로 변경하기
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-[11px] text-gray-500 flex-shrink-0">
          {activeTab === 'MY_APPLICATIONS' ? (
            <span>💡 신청하신 신메뉴 시식단은 사장님이 선정 시 1:1 대화방이 자동으로 열립니다. 대기 중인 신청은 언제든 <strong>[신청 취소하기]</strong>를 통해 회수할 수 있습니다.</span>
          ) : (
            <span>💡 상대 매장이 영업 중일 때 보낸 <strong>'비동기 찔러보기'</strong> 제안은 사장님이 여유가 되실 때 언제든 수락하여 교환을 진행할 수 있습니다.</span>
          )}
        </div>

      </div>
    </div>
  );
};
