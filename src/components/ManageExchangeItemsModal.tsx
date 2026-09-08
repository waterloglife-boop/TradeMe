import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit3, Image as ImageIcon, Camera, Check, AlertCircle, Utensils, Tag, Clock } from 'lucide-react';
import { Store, ExchangeItem, ItemType } from '../types/trade';
import { uploadStoreImageToSupabase, supabase } from '../lib/supabase';

interface ManageExchangeItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  onSaveItems: (updatedItems: ExchangeItem[]) => void;
}

export const ManageExchangeItemsModal: React.FC<ManageExchangeItemsModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onSaveItems,
}) => {
  const [items, setItems] = useState<ExchangeItem[]>(myStore.exchangeItems || []);
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State for new/editing item
  const [title, setTitle] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('FOOD');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(myStore.exchangeItems || []);
      setIsAddingOrEditing(false);
      setEditingItemId(null);
      setErrorMessage(null);
    }
  }, [isOpen, myStore.exchangeItems]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setEstimatedPrice(10000);
    setDescription('');
    setItemType('FOOD');
    setImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setEditingItemId(null);
    setIsAddingOrEditing(false);
    setErrorMessage(null);
  };

  const handleStartEdit = (item: ExchangeItem) => {
    setTitle(item.title);
    setEstimatedPrice(item.estimatedPrice);
    setDescription(item.description);
    setItemType(item.type || 'FOOD');
    setImageUrl(item.imageUrl);
    setEditingItemId(item.id);
    setIsAddingOrEditing(true);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAddingOrEditing(true);
  };

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

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('품목명을 입력해 주세요.');
      return;
    }

    if (editingItemId) {
      // Edit existing item
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                title: title.trim(),
                estimatedPrice,
                description: description.trim(),
                itemType,
                imageUrl,
              }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: ExchangeItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        storeId: myStore.id || '',
        title: title.trim(),
        estimatedPrice,
        description: description.trim(),
        type: itemType,
        imageUrl,
        isAvailable: true,
      };
      setItems((prev) => [...prev, newItem]);
    }

    resetForm();
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('정말 이 품목을 삭제하시겠습니까?')) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleSaveAllToDatabase = async () => {
    setSaving(true);
    try {
      // 1. Sync to Supabase items table if store exists
      if (myStore.id) {
        // Delete old items for this store
        await supabase.from('items').delete().eq('store_id', myStore.id);

        // Insert fresh items
        if (items.length > 0) {
          const itemRows = items.map((it) => ({
            id: it.id,
            store_id: myStore.id,
            title: it.title,
            estimated_price: it.estimatedPrice,
            description: it.description,
            image_url: it.imageUrl,
            item_type: it.type || 'FOOD',
            is_available: it.isAvailable ?? true,
          }));
          await supabase.from('items').insert(itemRows);
        }
      }

      // 2. Call parent updater
      onSaveItems(items);
      setSaving(false);
      onClose();
    } catch (err) {
      console.warn('Sync items notice:', err);
      onSaveItems(items);
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🍱
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>1:1 물물교환 대표 품목 관리</span>
                <span className="px-2 py-0.5 bg-white text-orange-700 font-extrabold text-[10px] rounded-full">
                  {items.length}개 등록중
                </span>
              </h3>
              <p className="text-[11px] text-orange-100">
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

        {/* Content Stream */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-gray-50/60">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form for Adding / Editing */}
          {isAddingOrEditing ? (
            <form onSubmit={handleSaveItem} className="bg-white p-5 rounded-2xl border-2 border-orange-300 shadow-md space-y-3.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-extrabold text-orange-700">
                  {editingItemId ? '✏️ 물물교환 품목 수정' : '➕ 신규 물물교환 품목 등록'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="미리보기"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200 shadow-sm flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="block text-[11px] font-bold text-gray-700 mb-1">메뉴/품목 사진</span>
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
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs rounded-xl border border-orange-200 transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? '업로드 중...' : '사진 선택 및 변경'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">품목명 (메뉴명)</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 특선 수제돈까스 세트"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">추정 가치 (단가 원)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">교환 설명 및 구성</label>
                <textarea
                  rows={2}
                  placeholder="예: 2인 식사 가능, 포장 가능합니다. 오늘 갓 조리한 따뜻한 상태로 제공됩니다."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingItemId ? '수정 완료' : '품목 추가'}</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleStartAdd}
              className="w-full py-3 border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>새로운 물물교환 품목 추가하기</span>
            </button>
          )}

          {/* List of Current Exchange Items */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider px-1">
              등록된 교환 품목 목록 ({items.length})
            </span>

            {items.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                <p className="font-bold text-gray-600 mb-1">등록된 품목이 없습니다.</p>
                <p className="text-[11px]">이웃 사장님들과 교환할 메뉴나 서비스를 등록해 보세요!</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-blue-700 font-extrabold text-xs mt-0.5">
                        {item.estimatedPrice.toLocaleString()}원
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-gray-500 font-medium">
            💡 저장 시 이웃 사장님들의 지도 화면에 즉시 반영됩니다.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAllToDatabase}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? '저장 중...' : '품목 설정 최종 저장'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
