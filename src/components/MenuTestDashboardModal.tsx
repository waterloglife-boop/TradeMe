import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, ExternalLink, Phone, MessageSquare, Sparkles, AlertCircle, RefreshCw, Plus, Edit3, Gift, Users, Trash2, Tag } from 'lucide-react';
import { MenuTestApplication, MenuTestCampaign, Store, MenuTestFeedbackType } from '../types/trade';
import {
  fetchMenuTestApplications,
  updateMenuTestApplicationStatus,
  deleteMenuTestApplication,
  fetchMenuTestCampaigns,
  saveMenuTestCampaignToSupabase,
  deleteMenuTestCampaignFromSupabase,
  supabase
} from '../lib/supabase';

interface MenuTestDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  onAcceptAndOpenChat: (applicant: MenuTestApplication) => void;
  onOpenRegisterMenuTest?: (campaignToEdit?: MenuTestCampaign | null, activeCount?: number) => void;
  onOpenMyApplications?: () => void;
  refreshTrigger?: number;
}

export const MenuTestDashboardModal: React.FC<MenuTestDashboardModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onAcceptAndOpenChat,
  onOpenRegisterMenuTest,
  onOpenMyApplications,
  refreshTrigger = 0,
}) => {
  const [campaigns, setCampaigns] = useState<MenuTestCampaign[]>([]);
  const [applications, setApplications] = useState<MenuTestApplication[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const storeId = myStore.id || 'my-store';

    // 1. Fetch campaigns
    let fetchedCampaigns = await fetchMenuTestCampaigns(storeId);
    if (!fetchedCampaigns || fetchedCampaigns.length === 0) {
      // Synthesize initial campaign from myStore
      const initial: MenuTestCampaign = {
        id: `campaign-initial-${storeId}`,
        storeId,
        title: myStore.menuTestTitle || '가을 신메뉴 1호 시식단',
        reward: myStore.menuTestReward || '신메뉴 2인 무료 시식 (음료 포함)',
        quota: myStore.menuTestQuota || 5,
        feedbackType: myStore.menuTestFeedbackType || 'BOTH',
        imageUrl: myStore.menuTestImageUrl || myStore.storeImageUrl,
        status: myStore.isMenuTesting ? 'RECRUITING' : 'CLOSED',
        createdAt: new Date().toISOString(),
      };
      await saveMenuTestCampaignToSupabase(initial);
      fetchedCampaigns = [initial];
    }
    setCampaigns(fetchedCampaigns);

    // 2. Fetch applications
    const apps = await fetchMenuTestApplications(storeId);
    setApplications(apps);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, myStore.id, refreshTrigger]);

  if (!isOpen) return null;

  const activeCampaigns = campaigns.filter((c) => c.status === 'RECRUITING');
  const activeCount = activeCampaigns.length;

  const handleToggleCampaignStatus = async (campaign: MenuTestCampaign) => {
    const newStatus = campaign.status === 'RECRUITING' ? 'CLOSED' : 'RECRUITING';
    if (newStatus === 'RECRUITING' && activeCount >= 2) {
      alert('⚠️ 동시 모집은 최대 2개까지만 가능합니다. 다른 모집글을 마감 후 활성화해 주세요.');
      return;
    }

    const updated = { ...campaign, status: newStatus as any };
    await saveMenuTestCampaignToSupabase(updated);
    const updatedList = campaigns.map((c) => (c.id === campaign.id ? updated : c));
    setCampaigns(updatedList);

    // Sync stores.is_menu_testing in DB
    const hasActive = updatedList.some((c) => c.status === 'RECRUITING');
    await supabase.from('stores').update({ is_menu_testing: hasActive }).eq('id', myStore.id);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('이 신메뉴 모집글을 삭제하시겠습니까?')) {
      await deleteMenuTestCampaignFromSupabase(campaignId, myStore.id);
      const updatedList = campaigns.filter((c) => c.id !== campaignId);
      setCampaigns(updatedList);

      const hasActive = updatedList.some((c) => c.status === 'RECRUITING');
      await supabase.from('stores').update({ is_menu_testing: hasActive }).eq('id', myStore.id);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('이 지원서를 영구 삭제하시겠습니까?')) return;
    await deleteMenuTestApplication(applicationId);
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
  };

  const handleStatusChange = async (app: MenuTestApplication, newStatus: 'ACCEPTED' | 'REJECTED') => {
    setActionLoadingId(app.id);
    await updateMenuTestApplicationStatus(app.id, newStatus);
    
    // Update local state immediately
    setApplications((prev) =>
      prev.map((item) => (item.id === app.id ? { ...item, status: newStatus } : item))
    );
    setActionLoadingId(null);

    if (newStatus === 'ACCEPTED') {
      onAcceptAndOpenChat(app);
      onClose();
    }
  };

  const getFeedbackBadge = (type: MenuTestFeedbackType) => {
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

  const filteredApplications = selectedCampaignId === 'ALL'
    ? applications
    : applications.filter((a) => a.campaignId === selectedCampaignId);

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-3.5 sm:p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center text-lg sm:text-xl shadow-inner flex-shrink-0">
                🧪
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                  신메뉴 시식단 & 서포터즈 모집
                </h2>
                <p className="text-[10px] sm:text-[11px] text-purple-100 truncate">
                  {myStore.storeName} ({myStore.ownerName} 사장님)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/20 transition-all"
                title="새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-Header: Badges & Buttons */}
          <div className="mt-2.5 pt-2 border-t border-purple-500/30 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-white/20 text-white font-extrabold text-[10px] sm:text-xs rounded-full whitespace-nowrap">
                동시 모집 {activeCount}/2개
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-gray-950 font-extrabold text-[10px] sm:text-xs rounded-full whitespace-nowrap animate-bounce">
                  새 신청 {pendingCount}건
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {onOpenMyApplications && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMyApplications();
                  }}
                  className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs rounded-xl transition-all whitespace-nowrap active:scale-95"
                >
                  <span>🧪 내가 신청한 시식단 보기</span>
                </button>
              )}

              {onOpenRegisterMenuTest && (
                <button
                  onClick={() => {
                    if (activeCount >= 2) {
                      alert('💡 현재 최대치인 2개의 신메뉴를 동시 모집 중입니다. 새 모집글을 등록하시려면 기존 글 중 하나를 마감해 주세요.');
                    } else {
                      onOpenRegisterMenuTest(null, activeCount);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-purple-50 text-purple-800 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>신규 모집 (+1)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 1. 진행 중인 신메뉴 모집글 목록 (최대 2개 동시 모집 카드) */}
        <div className="p-4 bg-purple-50/70 border-b border-purple-200 flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>📢 등록된 시식단 모집글 목록 ({campaigns.length}개 / 최대 2개 동시 활성화)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {campaigns.map((camp, idx) => {
              const campApps = applications.filter((a) => a.campaignId === camp.id || (!a.campaignId && idx === 0));
              const campAccepted = campApps.filter((a) => a.status === 'ACCEPTED').length;

              return (
                <div
                  key={camp.id}
                  className={`bg-white p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    camp.status === 'RECRUITING'
                      ? 'border-purple-300 shadow-sm ring-1 ring-purple-200'
                      : 'border-gray-200 opacity-75 bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={camp.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                      alt={camp.title}
                      className="w-12 h-12 rounded-xl object-cover border border-purple-200 flex-shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                          {idx === 0 ? '1호' : '2호'} 시식단
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCampaignStatus(camp)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
                            camp.status === 'RECRUITING'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {camp.status === 'RECRUITING' ? '● 모집중' : '마감됨'}
                        </button>
                      </div>

                      <h4 className="font-extrabold text-xs text-gray-900 truncate mt-1">
                        {camp.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        🎁 {camp.reward}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-600">
                    <div>
                      <span>신청: <strong className="text-purple-700">{campApps.length}명</strong></span>
                      <span className="mx-1">/</span>
                      <span>정원: <strong>{camp.quota}명</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onOpenRegisterMenuTest && (
                        <button
                          type="button"
                          onClick={() => onOpenRegisterMenuTest(camp, activeCount)}
                          className="p-1 text-purple-700 hover:bg-purple-50 rounded-lg"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="모집글 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign Filter Tabs */}
        {campaigns.length > 1 && (
          <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto text-xs flex-shrink-0">
            <button
              onClick={() => setSelectedCampaignId('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                selectedCampaignId === 'ALL'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              전체 지원서 ({applications.length})
            </button>
            {campaigns.map((camp, idx) => (
              <button
                key={camp.id}
                onClick={() => setSelectedCampaignId(camp.id)}
                className={`px-3 py-1 rounded-full font-bold transition-all truncate max-w-[160px] ${
                  selectedCampaignId === camp.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {idx === 0 ? '1호' : '2호'}: {camp.title}
              </button>
            ))}
          </div>
        )}

        {/* Content Body: Applications Stream */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
          <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider px-1">
            접수된 시식단 지원서 ({filteredApplications.length})
          </div>
          {loading && filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              신청서 목록을 불러오는 중입니다...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs space-y-2">
              <div className="text-3xl">📭</div>
              <p className="font-bold text-gray-700">접수된 신메뉴 체험단 신청서가 없습니다.</p>
              <p className="text-[11px] text-gray-500">
                인근 이웃 사장님들이 신메뉴 테스트 모집 공고를 확인하면 이곳에 신청서가 실시간으로 표시됩니다.
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm transition-all space-y-3 ${
                  app.status === 'ACCEPTED'
                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                    : app.status === 'REJECTED'
                    ? 'border-gray-200 opacity-60'
                    : 'border-purple-200 hover:shadow-md'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm text-gray-900">
                        {app.applicantStoreName}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">
                        ({app.applicantOwnerName} 사장님)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {app.campaignTitle && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gray-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                          {app.campaignTitle}
                        </span>
                      )}
                      {getFeedbackBadge(app.feedbackType)}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap pt-0.5">
                      <a
                        href={`tel:${app.applicantPhone}`}
                        className="flex items-center gap-1 text-gray-700 hover:text-purple-600 font-medium whitespace-nowrap"
                      >
                        <Phone className="w-3 h-3 text-gray-400" />
                        {app.applicantPhone}
                      </a>
                      <span>·</span>
                      <span className="whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 접수
                      </span>
                    </div>
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
                        미선정
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>검토 대기중</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* SNS Link If Available */}
                {app.snsUrl && (
                  <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-900 flex items-center gap-1">
                      📱 블로그 / SNS 채널:
                    </span>
                    <a
                      href={app.snsUrl.startsWith('http') ? app.snsUrl : `https://${app.snsUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1 underline truncate max-w-[280px]"
                    >
                      <span>{app.snsUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  </div>
                )}

                {/* Applicant Message */}
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-800 border border-gray-200 leading-relaxed">
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">💬 지원 각오 및 희망 방문 일정:</span>
                  <p className="font-medium whitespace-pre-wrap">{app.message}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDeleteApplication(app.id)}
                    className="px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-transparent hover:border-red-100"
                    title="지원서 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>지원서 삭제</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {app.status === 'PENDING' ? (
                      <button
                        type="button"
                        disabled={actionLoadingId === app.id}
                        onClick={() => handleStatusChange(app, 'ACCEPTED')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>체험단 선정 & 1:1 대화방 시작</span>
                      </button>
                    ) : app.status === 'ACCEPTED' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onAcceptAndOpenChat(app);
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{app.applicantOwnerName} 사장님과 1:1 대화하기</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(app, 'ACCEPTED')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-purple-600 font-bold text-xs rounded-xl border border-gray-200 transition-all whitespace-nowrap"
                      >
                        선정으로 변경하기
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-[11px] text-gray-500 flex-shrink-0">
          💡 함께하고 싶은 사장님을 <strong>[체험단 선정]</strong>해 주세요. 미선정된 사장님께는 거절 알림이 발송되지 않으며, 정해진 모집 기간이 지나면 자연스럽게 마감 처리됩니다.
        </div>

      </div>
    </div>
  );
};
