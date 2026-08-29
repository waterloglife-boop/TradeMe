import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Camera, Check, AlertCircle, Users, Gift, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Store, MenuTestCampaign, MenuTestFeedbackType } from '../types/trade';
import { uploadStoreImageToSupabase, saveMenuTestCampaignToSupabase, supabase } from '../lib/supabase';

interface RegisterMenuTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  editingCampaign?: MenuTestCampaign | null;
  activeCampaignCount?: number;
  onSaveCampaign: (campaign: MenuTestCampaign) => void;
}

export const RegisterMenuTestModal: React.FC<RegisterMenuTestModalProps> = ({
  isOpen,
  onClose,
  myStore,
  editingCampaign,
  activeCampaignCount = 0,
  onSaveCampaign,
}) => {
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('');
  const [quota, setQuota] = useState<number>(5);
  const [feedbackType, setFeedbackType] = useState<MenuTestFeedbackType>('BOTH');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  );
  const [status, setStatus] = useState<'RECRUITING' | 'CLOSED'>('RECRUITING');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCampaign) {
        setTitle(editingCampaign.title);
        setReward(editingCampaign.reward);
        setQuota(editingCampaign.quota);
        setFeedbackType(editingCampaign.feedbackType);
        setImageUrl(
          editingCampaign.imageUrl || myStore.storeImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
        );
        setStatus(editingCampaign.status);
      } else {
        setTitle(`신메뉴 ${activeCampaignCount + 1}호 시식단`);
        setReward('신메뉴 2인 무료 시식 (음료 포함)');
        setQuota(5);
        setFeedbackType('BOTH');
        setImageUrl(
          myStore.storeImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
        );
        setStatus('RECRUITING');
      }
      setErrorMessage(null);
    }
  }, [isOpen, editingCampaign, myStore, activeCampaignCount]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const res = await uploadStoreImageToSupabase(file);
    setUploadingImage(false);

    if (res.success && res.url) {
      setImageUrl(res.url);
    } else {
      setErrorMessage(res.error || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('모집할 신메뉴명을 입력해 주세요.');
      return;
    }

    if (!editingCampaign && status === 'RECRUITING' && activeCampaignCount >= 2) {
      setErrorMessage('⚠️ 동시 모집은 최대 2개까지만 가능합니다. 기존 모집글을 마감 후 새로 등록해 주세요.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const campaignId = editingCampaign?.id || `campaign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newOrUpdatedCampaign: MenuTestCampaign = {
      id: campaignId,
      storeId: myStore.id,
      title: title.trim(),
      reward: reward.trim(),
      quota,
      feedbackType,
      imageUrl,
      status,
      createdAt: editingCampaign?.createdAt || new Date().toISOString(),
      applicantCount: editingCampaign?.applicantCount || 0,
      acceptedCount: editingCampaign?.acceptedCount || 0,
    };

    try {
      await saveMenuTestCampaignToSupabase(newOrUpdatedCampaign);

      // Sync store table representative fields
      if (status === 'RECRUITING') {
        await supabase
          .from('stores')
          .update({
            is_menu_testing: true,
            menu_test_title: title.trim(),
            menu_test_reward: reward.trim(),
            menu_test_quota: quota,
            menu_test_feedback_type: feedbackType,
            menu_test_image_url: imageUrl,
          })
          .eq('id', myStore.id);
      }

      onSaveCampaign(newOrUpdatedCampaign);
      setSaving(false);
      onClose();
    } catch (err) {
      console.warn('Sync menu test notice:', err);
      onSaveCampaign(newOrUpdatedCampaign);
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🧪
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>신메뉴 / 신규서비스 시식단 모집 등록</span>
                <span className="px-2 py-0.5 bg-white text-purple-800 font-extrabold text-[10px] rounded-full">
                  서포터즈
                </span>
              </h3>
              <p className="text-[11px] text-purple-100">
                {myStore.storeName} ({myStore.ownerName} 사장님)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 bg-gray-50/70">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Recruitment ON/OFF Toggle Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            isMenuTesting ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-gray-100 border-gray-300 text-gray-700'
          }`}>
            <div>
              <span className="block text-xs font-extrabold">
                {isMenuTesting ? '📢 시식단 모집 상태: 활성화 (모집중)' : '⏸️ 시식단 모집 상태: 일시정지 (모집마감)'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isMenuTesting ? '지도 마커에 🧪 신메뉴 뱃지가 표출되며 누구나 신청 가능합니다.' : '지도에서 🧪 신메뉴 뱃지가 숨겨집니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuTesting(!isMenuTesting)}
              className={`p-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all ${
                isMenuTesting ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isMenuTesting ? '모집 ON' : '모집 OFF'}
            </button>
          </div>

          {/* Photo Upload */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
            <img
              src={imageUrl}
              alt="신메뉴 사진"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200 shadow-sm flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-gray-800 mb-0.5">신메뉴 대표 사진</span>
              <p className="text-[11px] text-gray-500 mb-2">시식단 모집 카드에 노출될 군침 도는 사진을 올려주세요</p>
              
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
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200 transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{uploadingImage ? '업로드 중...' : '사진 선택 및 변경'}</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              신메뉴 / 테스트 품목명
            </label>
            <input
              type="text"
              required
              placeholder="예: 가을 신메뉴 마라곱창전골 1호 시식단"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold"
            />
          </div>

          {/* Reward / Offer Details */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              제공 혜택 및 상세 내용
            </label>
            <textarea
              rows={2}
              required
              placeholder="예: 마라곱창전골(중) 2인 무료 시식 + 시원한 음료 2캔 제공"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-medium resize-none"
            />
          </div>

          {/* Quota & Feedback Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                모집 정원 (명)
              </label>
              <input
                type="number"
                required
                min={1}
                max={50}
                value={quota}
                onChange={(e) => setQuota(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                희망 피드백 방식
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold bg-white"
              >
                <option value="BOTH">🌟 SNS 후기 + 비밀 리포트 (추천)</option>
                <option value="BLOG_SNS">📱 블로그 / SNS 홍보 리뷰</option>
                <option value="SECRET_REPORT">🔒 1:1 비밀 솔직 피드백</option>
              </select>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? '등록 중...' : '신메뉴 시식단 모집 저장'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
