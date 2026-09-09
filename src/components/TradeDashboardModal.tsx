import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, RefreshCw, Sparkles, Inbox, Send } from 'lucide-react';
import { TradeProposal, Store } from '../types/trade';
import { fetchTradeProposalsFromSupabase, updateTradeProposalStatus, fetchStoredVouchers, issueBilateralVouchersForTrade } from '../lib/supabase';

interface TradeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  allStores: Store[];
  onAcceptAndOpenChat: (proposal: TradeProposal) => void;
  onOpenChat: (store: Store) => void;
}

export const TradeDashboardModal: React.FC<TradeDashboardModalProps> = ({
  isOpen,
  onClose,
  myStore,
  allStores,
  onAcceptAndOpenChat,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadProposals = async () => {
    setLoading(true);
    const data = await fetchTradeProposalsFromSupabase(myStore.id);
    setProposals(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadProposals();
    }
  }, [isOpen, myStore.id]);

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

  const currentList = activeTab === 'RECEIVED' ? receivedProposals : sentProposals;
  const pendingReceivedCount = receivedProposals.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
              🤝
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>1:1 물물교환 제안함 (거래 관리)</span>
                {pendingReceivedCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-orange-700 font-extrabold text-[10px] rounded-full shadow-sm animate-bounce">
                    새 제안 {pendingReceivedCount}건
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-orange-100">
                {myStore.storeName} ({myStore.ownerName} 사장님)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={loadProposals}
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

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'RECEIVED'
                ? 'border-orange-500 text-orange-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>받은 교환 제안 ({receivedProposals.length})</span>
            {pendingReceivedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'SENT'
                ? 'border-orange-500 text-orange-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>보낸 교환 제안 ({sentProposals.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
          {loading && currentList.length === 0 ? (
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
                  className={`bg-white rounded-2xl p-4 border shadow-sm transition-all space-y-3 ${
                    proposal.status === 'ACCEPTED'
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : proposal.status === 'REJECTED'
                      ? 'border-gray-200 opacity-60'
                      : proposal.isPoke
                      ? 'border-indigo-200 hover:shadow-md'
                      : 'border-orange-200 hover:shadow-md'
                  }`}
                >
                  {/* Card Header: Mode Badge & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Poke vs Realtime Badge */}
                      {proposal.isPoke ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 shadow-sm">
                          <span>👉</span>
                          비동기 찔러보기 (교환 OFF 상태 제안)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-sm">
                          <span>⚡</span>
                          실시간 물물교환 제안
                        </span>
                      )}

                      {/* Voucher Trade Badge */}
                      {(proposal.tradeType === 'VOUCHER' ||
                        proposal.tradeFulfillment?.includes('교환권') ||
                        proposal.myItemTitle?.includes('교환권') ||
                        proposal.myItemTitle?.includes('이용권') ||
                        proposal.myItemTitle?.includes('상품권') ||
                        proposal.targetItemTitle?.includes('교환권') ||
                        proposal.targetItemTitle?.includes('이용권') ||
                        proposal.targetItemTitle?.includes('상품권')) && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-sm">
                          <span>🎟️</span>
                          <span>상생 교환권 맞발행</span>
                        </span>
                      )}

                      <span className="text-xs font-extrabold text-gray-900">
                        {otherStoreName} ({otherOwnerName})
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {proposal.status === 'ACCEPTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          교환 수락됨
                        </span>
                      ) : proposal.status === 'REJECTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          거절됨
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          수락 대기중
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Comparison Box */}
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block mb-1">
                        {activeTab === 'RECEIVED' ? '🏬 상대가 제안한 품목' : '👑 내가 제안한 품목'}
                      </span>
                      <p className="font-extrabold text-gray-900 line-clamp-1">
                        {proposal.myItemTitle || '교환 품목'}
                      </p>
                      {proposal.myItemPrice && (
                        <p className="text-blue-700 font-extrabold text-[11px] mt-0.5">
                          {proposal.myItemPrice.toLocaleString()}원
                        </p>
                      )}
                    </div>
                    <div className="border-l border-gray-200 pl-2">
                      <span className="text-[10px] font-bold text-gray-500 block mb-1">
                        {activeTab === 'RECEIVED' ? '👑 내 매장 희망 품목' : '🏬 상대 매장 희망 품목'}
                      </span>
                      <p className="font-extrabold text-gray-900 line-clamp-1">
                        {proposal.targetItemTitle || '교환 대상 품목'}
                      </p>
                      {proposal.targetItemPrice && (
                        <p className="text-orange-600 font-extrabold text-[11px] mt-0.5">
                          {proposal.targetItemPrice.toLocaleString()}원
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price Difference & Time Details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-gray-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>희망 픽업: <strong>{proposal.proposedTime}</strong></span>
                      </div>
                      {proposal.tradeFulfillment && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          {proposal.tradeFulfillment}
                        </span>
                      )}
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                      proposal.priceDifference === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {proposal.priceDifference === 0
                        ? '동등 가치 교환 (차액 0원)'
                        : `차액 ${Math.abs(proposal.priceDifference).toLocaleString()}원 정산`}
                    </div>
                  </div>

                  {/* Memo/Message if exists */}
                  {proposal.message && (
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-xs text-gray-700">
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5">💬 전달 메모:</span>
                      <p className="font-medium">{proposal.message}</p>
                    </div>
                  )}

                  {/* Action Buttons (For Received Proposals) */}
                  {activeTab === 'RECEIVED' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      {proposal.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === proposal.id}
                            onClick={() => handleStatusChange(proposal, 'REJECTED')}
                            className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>거절</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoadingId === proposal.id}
                            onClick={() => handleStatusChange(proposal, 'ACCEPTED')}
                            className={`px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                              proposal.isPoke
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>교환 수락 & 1:1 대화 시작</span>
                          </button>
                        </>
                      ) : proposal.status === 'ACCEPTED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onAcceptAndOpenChat(proposal);
                            onClose();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>1:1 대화방 열기</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(proposal, 'ACCEPTED')}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600 font-bold text-xs rounded-xl border border-gray-200 transition-all"
                        >
                          수락으로 변경하기
                        </button>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-[11px] text-gray-500 flex-shrink-0">
          💡 상대 매장이 영업 중일 때 보낸 <strong>'비동기 찔러보기'</strong> 제안은 사장님이 여유가 되실 때 언제든 수락하여 교환을 진행할 수 있습니다.
        </div>

      </div>
    </div>
  );
};
