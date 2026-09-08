import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Camera, Loader2, MessageSquare, Zap, HelpCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { CommunityCategory, CommunityPost, Store } from '../types/trade';
import { createCommunityPost, uploadStoreImageToSupabase } from '../lib/supabase';
import { parseNeighborhoodInfo } from '../utils/location';

interface CreateCommunityPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  userOwnerName: string;
  onPostCreated: (post: CommunityPost) => void;
}

export const CreateCommunityPostModal: React.FC<CreateCommunityPostModalProps> = ({
  isOpen,
  onClose,
  myStore,
  userOwnerName,
  onPostCreated,
}) => {
  const [category, setCategory] = useState<CommunityCategory>('DAILY_TALK');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [urgentExchangeItem, setUrgentExchangeItem] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const neighborhood = parseNeighborhoodInfo(myStore.address);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('사진 용량은 5MB 이하만 가능합니다.');
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage(null);
    const res = await uploadStoreImageToSupabase(file);
    setIsUploadingImage(false);

    if (res.success && res.url) {
      setImageUrl(res.url);
    } else {
      setErrorMessage(res.error || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('내용을 입력해 주세요.');
      return;
    }
    if (category === 'URGENT_TRADE' && !urgentExchangeItem.trim()) {
      setErrorMessage('마감 번개교환으로 제공/교환할 품목을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const author = isAnonymous ? '익명의 사장님' : `${userOwnerName || '사장님'} 사장님`;
    const store = isAnonymous ? neighborhood.anonStore : (myStore.storeName || '우리 매장');

    const result = await createCommunityPost({
      storeId: myStore.id,
      authorName: author,
      storeName: store,
      isAnonymous,
      category,
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      urgentExchangeItem: category === 'URGENT_TRADE' ? urgentExchangeItem.trim() : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      onPostCreated(result.data);
      // Reset form
      setTitle('');
      setContent('');
      setUrgentExchangeItem('');
      setImageUrl('');
      setIsAnonymous(false);
      onClose();
    } else {
      setErrorMessage(result.error || '게시글 작성에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-black text-base">
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            <span>사랑방 이야기 나누기</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* 1. Category Selector */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-2">카테고리 선택</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('DAILY_TALK')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === 'DAILY_TALK'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-200'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mb-1">💬</span>
                <span>오늘 장사 톡</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('URGENT_TRADE')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === 'URGENT_TRADE'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-2 ring-rose-200'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mb-1">🚨</span>
                <span>마감 번개교환</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('TIPS_QNA')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === 'TIPS_QNA'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-200'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mb-1">💡</span>
                <span>동네 꿀팁·질문</span>
              </button>
            </div>
          </div>

          {/* 2. Anonymous / Real Store Name Toggle */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-base">
                {isAnonymous ? '🤫' : '🏬'}
              </div>
              <div>
                <div className="text-xs font-black text-gray-800">
                  {isAnonymous ? '익명으로 게시하기' : `매장명 노출: ${myStore.storeName || '우리 매장'}`}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {isAnonymous ? `상호명이 숨겨지고 "${neighborhood.anonStore}"으로 표기됩니다` : '이웃 사장님들에게 내 가게를 홍보할 수 있습니다'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isAnonymous ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 3. Urgent Trade Special Box (if URGENT_TRADE) */}
          {category === 'URGENT_TRADE' && (
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-200 rounded-2xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-black">
                <span>🚨</span>
                <span>마감 임박 교환 품목 (로스 제로)</span>
              </div>
              <p className="text-[11px] text-rose-600">
                오늘 마감 전 남는 재고나 음식을 입력해 주시면 이웃 매장과의 즉시 맞교환 버튼이 활성화됩니다!
              </p>
              <input
                type="text"
                value={urgentExchangeItem}
                onChange={(e) => setUrgentExchangeItem(e.target.value)}
                placeholder="예: 당일 베이글 4세트 ↔ 야식/치킨/커피 아무거나"
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* 4. Title Input */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">글 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'DAILY_TALK'
                  ? '예: 오늘 비가 와서 배달콜이 뚝 끊겼네요 ㅠㅠ'
                  : category === 'URGENT_TRADE'
                  ? '예: [마감임박] 당일 만든 샐러드 3팩 맞바꿔요!'
                  : '예: 북정동 근처 냉동고 수리기사님 잘하시는 분 계신가요?'
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          {/* 5. Content Input */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">글 내용</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이웃 사장님들과 나누고 싶은 이야기, 오늘 장사 소회, 진솔한 질문을 편안하게 적어주세요. 따뜻한 응원과 댓글이 오갑니다."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none leading-relaxed"
            />
          </div>

          {/* 6. Image Upload */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">사진 첨부 (선택)</label>
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-h-48 bg-gray-100 flex items-center justify-center">
                <img src={imageUrl} alt="첨부 이미지" className="max-h-48 w-auto object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-400 hover:bg-orange-50/50 cursor-pointer transition">
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-orange-600 text-xs font-bold py-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>이미지 업로드 중...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-gray-600">음식/매장 사진 올리기</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG 최대 5MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black shadow-lg shadow-orange-500/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>등록 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>이야기 등록하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
