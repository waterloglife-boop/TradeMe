import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, ExternalLink, Phone, MessageSquare, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { MenuTestApplication, Store, MenuTestFeedbackType } from '../types/trade';
import { fetchMenuTestApplications, updateMenuTestApplicationStatus } from '../lib/supabase';

interface MenuTestDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  onAcceptAndOpenChat: (applicant: MenuTestApplication) => void;
}

export const MenuTestDashboardModal: React.FC<MenuTestDashboardModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onAcceptAndOpenChat,
}) => {
  const [applications, setApplications] = useState<MenuTestApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    const data = await fetchMenuTestApplications(myStore.id || 'my-store');
    setApplications(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen, myStore.id]);

  if (!isOpen) return null;

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

  const getFeedbackBadge = (type?: MenuTestFeedbackType) => {
    switch (type) {
      case 'BLOG_SNS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">📱 SNS / 블로그 후기</span>;
      case 'SECRET_REPORT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🔒 1:1 비밀 피드백 리포트</span>;
      case 'BOTH':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🌟 SNS 후기 + 비밀 피드백</span>;
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🧪
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>신메뉴 시식단 & 서포터즈 신청 관리</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-400 text-gray-950 font-extrabold text-[10px] rounded-full animate-bounce">
                    새 신청 {pendingCount}건
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-purple-100">
                {myStore.storeName} ({myStore.ownerName} 사장님)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={loadApplications}
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

        {/* Campaign Info Bar */}
        <div className="p-3 bg-purple-50 border-b border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 text-purple-900 font-bold">
            <span>📢 모집 신메뉴:</span>
            <span className="text-gray-900 font-extrabold">{myStore.menuTestTitle || '가을 신메뉴 1호 시식단'}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="text-gray-600">모집 정원: <strong>{myStore.menuTestQuota || 5}명</strong></span>
            <span className="text-purple-700">총 접수: <strong>{applications.length}명</strong></span>
            <span className="text-emerald-700">선정 완료: <strong>{acceptedCount}명</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
          {loading && applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              신청서 목록을 불러오는 중입니다...
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs space-y-2">
              <div className="text-3xl">📭</div>
              <p className="font-bold text-gray-700">아직 접수된 신메뉴 체험단 신청서가 없습니다.</p>
              <p className="text-[11px] text-gray-500">
                인근 이웃 사장님들이 신메뉴 테스트 모집 공고를 확인하면 이곳에 신청서가 실시간으로 표시됩니다.
              </p>
            </div>
          ) : (
            applications.map((app) => (
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
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">
                        {app.applicantStoreName}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">
                        ({app.applicantOwnerName} 사장님)
                      </span>
                      {getFeedbackBadge(app.feedbackType)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                      <a
                        href={`tel:${app.applicantPhone}`}
                        className="flex items-center gap-1 text-gray-700 hover:text-purple-600 font-medium"
                      >
                        <Phone className="w-3 h-3 text-gray-400" />
                        {app.applicantPhone}
                      </a>
                      <span>·</span>
                      <span>{new Date(app.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 접수</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {app.status === 'ACCEPTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        선정 완료
                      </span>
                    ) : app.status === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        미선정
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        검토 대기중
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
                <div className="flex items-center justify-end gap-2 pt-1">
                  {app.status === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        disabled={actionLoadingId === app.id}
                        onClick={() => handleStatusChange(app, 'REJECTED')}
                        className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>정원 초과 / 거절</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === app.id}
                        onClick={() => handleStatusChange(app, 'ACCEPTED')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>체험단 수락 & 1:1 대화방 시작</span>
                      </button>
                    </>
                  ) : app.status === 'ACCEPTED' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onAcceptAndOpenChat(app);
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{app.applicantOwnerName} 사장님과 1:1 대화하기</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(app, 'ACCEPTED')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-purple-600 font-bold text-xs rounded-xl border border-gray-200 transition-all"
                    >
                      수락으로 변경하기
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-[11px] text-gray-500 flex-shrink-0">
          💡 지원서를 수락하면 상대 사장님과의 1:1 대화방이 즉시 열리며, 방문 일정 및 인원을 조율할 수 있습니다.
        </div>

      </div>
    </div>
  );
};
