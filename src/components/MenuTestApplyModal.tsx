import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { Store, MenuTestFeedbackType, MenuTestCampaign } from '../types/trade';
import { applyMenuTestCampaign } from '../lib/supabase';

interface MenuTestApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: Store | null;
  targetCampaign?: MenuTestCampaign | null;
  applicantOwnerName: string;
  applicantStoreName: string;
  applicantPhone: string;
  onSuccess: () => void;
}

export const MenuTestApplyModal: React.FC<MenuTestApplyModalProps> = ({
  isOpen,
  onClose,
  targetStore,
  targetCampaign,
  applicantOwnerName,
  applicantStoreName,
  applicantPhone,
  onSuccess,
}) => {
  const [snsUrl, setSnsUrl] = useState('');
  const [message, setMessage] = useState('');
  const [agreeFtcGuideline, setAgreeFtcGuideline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !targetStore) return null;

  const activeTitle = targetCampaign?.title || targetStore.menuTestTitle || '가을 신메뉴 1호 시식단';
  const activeReward = targetCampaign?.reward || targetStore.menuTestReward || '신메뉴 2인 무료 시식';
  const activeFeedbackType = targetCampaign?.feedbackType || targetStore.menuTestFeedbackType || 'BOTH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('사장님께 전달할 각오 및 방문 희망 시간대를 입력해 주세요.');
      return;
    }

    setLoading(true);
    const res = await applyMenuTestCampaign({
      storeId: targetStore.id,
      campaignId: targetCampaign?.id,
      campaignTitle: activeTitle,
      applicantStoreName: applicantStoreName || '이웃 사장님 매장',
      applicantOwnerName: applicantOwnerName || '이웃 사장님',
      applicantPhone: applicantPhone || '010-0000-0000',
      snsUrl: snsUrl.trim(),
      message: message.trim(),
      feedbackType: activeFeedbackType,
    });

    setLoading(false);
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  const getFeedbackTypeBadge = (type?: MenuTestFeedbackType) => {
    switch (type) {
      case 'BLOG_SNS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">📱 블로그 / SNS 솔직 후기</span>;
      case 'SECRET_REPORT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🔒 사장님 전용 1:1 비밀 피드백 리포트</span>;
      case 'BOTH':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🌟 SNS 후기 + 1:1 비밀 피드백 리포트</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg shadow-inner">
              🧪
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                {targetCampaign?.title ? `${targetCampaign.title} 신청` : '신메뉴 시식단 / 리뷰 체험단 신청'}
              </h2>
              <p className="text-[11px] text-purple-100">
                {targetStore.storeName} ({targetStore.ownerName} 사장님)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              신메뉴 체험단 신청이 완료되었습니다!
            </h3>
            <p className="text-xs text-gray-600 max-w-xs">
              <strong>{targetStore.ownerName}</strong> 사장님께 신청서가 전달되었습니다. 승인 시 1:1 대화방으로 일정 조율 알림이 도착합니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Campaign Summary Card */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                    모집 대상 신메뉴
                  </span>
                  <h4 className="font-extrabold text-gray-900 text-sm mt-1">
                    {targetStore.menuTestTitle || '가을 신메뉴 1호 시식단'}
                  </h4>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] font-bold text-purple-700">
                    모집 정원 {targetStore.menuTestQuota || 5}명
                  </span>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-2.5 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-gray-700 font-medium">
                  <span>🎁 <strong>무료 제공 혜택:</strong></span>
                  <span className="font-bold text-purple-900">{targetStore.menuTestReward || '신메뉴 무료 시식권'}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700 font-medium pt-1 border-t border-purple-50">
                  <span>📝 <strong>약속할 피드백:</strong></span>
                  <div>{getFeedbackTypeBadge(targetStore.menuTestFeedbackType)}</div>
                </div>
              </div>
            </div>

            {/* Applicant Store Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-[10px] text-gray-500 block font-bold">신청 사장님</span>
                <span className="font-extrabold text-gray-900">{applicantOwnerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block font-bold">운영 매장명</span>
                <span className="font-extrabold text-gray-900">{applicantStoreName}</span>
              </div>
            </div>

            {/* SNS / Blog URL input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>네이버 블로그 / 인스타그램 SNS 주소 (선택)</span>
                <span className="text-[10px] text-purple-600 font-normal">체험단 선정 확률 UP!</span>
              </label>
              <input
                type="text"
                placeholder="https://blog.naver.com/... 또는 @instagram_id"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Application Message */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                사장님께 전하는 한마디 & 희망 방문 시간대 <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="예: 안녕하세요! 인근에서 매장 운영 중인 사장님입니다. 신메뉴 맛과 플레이팅에 대해 전문가의 눈으로 솔직하게 피드백 리포트 남겨드리고 블로그에도 정성껏 사진과 리뷰 남겨드리겠습니다!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* FTC Guideline Safe Notice Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>공정거래위원회 표시광고 가이드 준수 안전 안심 안내</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                블로그나 SNS에 후기를 작성하실 때는 하단에 <strong>"동네 이웃 사장님 신메뉴 체험단으로 시식/서비스를 제공받아 솔직하게 작성된 후기입니다"</strong>라는 문구를 포함해 주시면 100% 합법적이고 안전하게 홍보 효과를 누리실 수 있습니다.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeFtcGuideline}
                  onChange={(e) => setAgreeFtcGuideline(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px] font-bold text-gray-700">
                  위 솔직 후기 및 피드백 약속을 확인하였으며 이에 동의합니다.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreeFtcGuideline}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? '신청서 전달 중...' : '신메뉴 1호 체험단 신청서 전달하기'}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
