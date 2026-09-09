import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit3, Image as ImageIcon, Camera, Check, AlertCircle, Utensils, Tag, Clock } from 'lucide-react';
import { Store, ExchangeItem, ItemType, FulfillmentType } from '../types/trade';
import { uploadStoreImageToSupabase, supabase, serializeFulfillmentDescription } from '../lib/supabase';

interface ManageExchangeItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  onSaveItems: (updatedItems: ExchangeItem[], extraStoreProps?: Partial<Store>) => void;
}

export const ManageExchangeItemsModal: React.FC<ManageExchangeItemsModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onSaveItems,
}) => {
  // Regular items list (excluding voucher)
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State for new/editing item
  const [title, setTitle] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('FOOD');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
  const [fulfillmentTypes, setFulfillmentTypes] = useState<FulfillmentType[]>(['PICKUP', 'ON_SITE']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🎟️ Win-Win Amount Voucher State
  const [voucherActive, setVoucherActive] = useState<boolean>(false);
  const [voucherAmount, setVoucherAmount] = useState<number>(20000);
  const [voucherFulfillmentTypes, setVoucherFulfillmentTypes] = useState<FulfillmentType[]>(['PICKUP', 'ON_SITE']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const allItems = myStore.exchangeItems || [];
      const foundVoucher = allItems.find(
        (it) => it.isVoucher || it.type === 'VOUCHER' || it.id.startsWith('voucher-')
      );

      // Keep only regular items in state
      setItems(allItems.filter((it) => !it.isVoucher && it.type !== 'VOUCHER' && !it.id.startsWith('voucher-')));

      const isVActive = myStore.voucherActive !== undefined ? myStore.voucherActive : (!!foundVoucher && (foundVoucher.isAvailable ?? true));
      setVoucherActive(isVActive);
      setVoucherAmount(myStore.voucherAmount || foundVoucher?.estimatedPrice || 20000);
      setVoucherFulfillmentTypes(
        myStore.voucherFulfillmentTypes && myStore.voucherFulfillmentTypes.length > 0
          ? myStore.voucherFulfillmentTypes
          : (foundVoucher?.fulfillmentTypes && foundVoucher.fulfillmentTypes.length > 0
            ? foundVoucher.fulfillmentTypes
            : ['PICKUP', 'ON_SITE'])
      );
      setIsAddingOrEditing(false);
      setEditingItemId(null);
      setErrorMessage(null);
    }
  }, [isOpen, myStore]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setEstimatedPrice(10000);
    setDescription('');
    setItemType('FOOD');
    setImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setFulfillmentTypes(['PICKUP', 'ON_SITE']);
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
    setFulfillmentTypes(item.fulfillmentTypes && item.fulfillmentTypes.length > 0 ? item.fulfillmentTypes : ['PICKUP', 'ON_SITE']);
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

    if (fulfillmentTypes.length === 0) {
      setErrorMessage('제공 및 이용 방식을 최소 1개 이상 선택해 주세요.');
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
                fulfillmentTypes,
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
        fulfillmentTypes,
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
    if (voucherActive && voucherFulfillmentTypes.length === 0) {
      setErrorMessage('금액 교환권의 제공 및 이용 방식을 최소 1개 이상 선택해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const regularItems = items.filter((it) => !it.isVoucher && it.type !== 'VOUCHER');
      let finalItems: ExchangeItem[] = [...regularItems];

      if (voucherActive) {
        const existingVoucher = (myStore.exchangeItems || []).find(
          (it) => it.isVoucher || it.type === 'VOUCHER' || it.id.startsWith('voucher-')
        );
        const voucherId = existingVoucher?.id || `voucher-${myStore.id}`;
        const voucherItem: ExchangeItem = {
          id: voucherId,
          storeId: myStore.id,
          title: `${myStore.storeName} ${voucherAmount.toLocaleString()}원 상생 이용권`,
          estimatedPrice: voucherAmount,
          description: '전 메뉴 및 서비스 자유 선택 이용 (차액 결제 가능)',
          type: 'VOUCHER',
          imageUrl: myStore.storeImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
          fulfillmentTypes: voucherFulfillmentTypes,
          isVoucher: true,
        };
        finalItems.push(voucherItem);
      }

      // 1. Sync to Supabase items table if store exists
      if (myStore.id) {
        // Delete old items for this store
        await supabase.from('items').delete().eq('store_id', myStore.id);

        // Insert fresh items
        if (finalItems.length > 0) {
          const itemRows = finalItems.map((it) => ({
            id: it.id,
            store_id: myStore.id,
            title: it.title,
            estimated_price: it.estimatedPrice,
            description: serializeFulfillmentDescription(it.description, it.fulfillmentTypes),
            image_url: it.imageUrl,
            item_type: it.type || (it.isVoucher ? 'VOUCHER' : 'FOOD'),
            is_available: it.isAvailable ?? true,
          }));
          await supabase.from('items').insert(itemRows);
        }
      }

      // 2. Call parent updater
      onSaveItems(finalItems, {
        voucherActive,
        voucherAmount,
        voucherFulfillmentTypes,
        voucherMaxIssue: 3,
      });
      setSaving(false);
      onClose();
    } catch (err) {
      console.warn('Sync items notice:', err);
      onSaveItems(items, {
        voucherActive,
        voucherAmount,
        voucherFulfillmentTypes,
        voucherMaxIssue: 3,
      });
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
                <span>1:1 물물교환 품목 및 금액권 관리</span>
                <span className="px-2 py-0.5 bg-white text-orange-700 font-extrabold text-[10px] rounded-full">
                  {items.length}개 메뉴 · {voucherActive ? '금액권 ON' : '금액권 OFF'}
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

          {/* ========================================================================= */}
          {/* 🎟️ SECTION 1: 상생 금액 교환권 (자유이용 상품권) 설정                     */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-100/50 rounded-2xl border-2 border-amber-300/80 p-4 shadow-sm space-y-3.5">
            {/* Toggle Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-lg shadow-sm">
                  🎟️
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>우리 매장 상생 금액 교환권 (상품권)</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-200 text-amber-900 rounded">
                      자유 이용권
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-600">
                    특정 메뉴 대신 전 메뉴/서비스에서 금액 차감 방식으로 사용
                  </p>
                </div>
              </div>

              {/* Modern Switch Toggle */}
              <button
                type="button"
                onClick={() => setVoucherActive(!voucherActive)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  voucherActive ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    voucherActive ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {voucherActive ? (
              <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in-50">
                {/* Amount Preset Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                    <span>교환권 액면 금액</span>
                    <span className="text-[10px] text-orange-600 font-bold">1:1 등가 교환 기준</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[10000, 20000, 30000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setVoucherAmount(amt)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all ${
                          voucherAmount === amt
                            ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-300'
                            : 'bg-white text-gray-700 border border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {amt.toLocaleString()}원
                        {amt === 20000 && <span className="block text-[8px] opacity-80">추천</span>}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={5000}
                      step={1000}
                      value={voucherAmount}
                      onChange={(e) => setVoucherAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="직접 금액 입력"
                      className="w-full pl-3 pr-10 py-2 bg-white border border-amber-300 rounded-xl text-xs font-black text-orange-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-gray-500">원</span>
                  </div>
                </div>

                {/* Fulfillment Types for Voucher */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                    <span>교환권 제공 및 이용 방식</span>
                    <span className="text-[10px] text-gray-400">중복 선택 가능</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherFulfillmentTypes((prev) =>
                          prev.includes('PICKUP') ? prev.filter((t) => t !== 'PICKUP') : [...prev, 'PICKUP']
                        );
                      }}
                      className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                        voucherFulfillmentTypes.includes('PICKUP')
                          ? 'border-orange-500 bg-orange-100 text-orange-950 ring-2 ring-orange-300 shadow-xs font-black'
                          : 'border-amber-200 bg-white text-gray-500 hover:bg-amber-50 font-bold'
                      }`}
                    >
                      <span className="text-sm">🛍️</span>
                      <span className="text-[11px]">직접 픽업</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVoucherFulfillmentTypes((prev) =>
                          prev.includes('DELIVERY') ? prev.filter((t) => t !== 'DELIVERY') : [...prev, 'DELIVERY']
                        );
                      }}
                      className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                        voucherFulfillmentTypes.includes('DELIVERY')
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-300 shadow-xs font-black'
                          : 'border-amber-200 bg-white text-gray-500 hover:bg-amber-50 font-bold'
                      }`}
                    >
                      <span className="text-sm">🛵</span>
                      <span className="text-[11px]">배달 / 배송</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVoucherFulfillmentTypes((prev) =>
                          prev.includes('ON_SITE') ? prev.filter((t) => t !== 'ON_SITE') : [...prev, 'ON_SITE']
                        );
                      }}
                      className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                        voucherFulfillmentTypes.includes('ON_SITE')
                          ? 'border-indigo-500 bg-indigo-100 text-indigo-950 ring-2 ring-indigo-300 shadow-xs font-black'
                          : 'border-amber-200 bg-white text-gray-500 hover:bg-amber-50 font-bold'
                      }`}
                    >
                      <span className="text-sm">🏢</span>
                      <span className="text-[11px]">현장 방문 이용</span>
                    </button>
                  </div>
                </div>

                {/* Safe limits & Policy badge row */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-600 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1 font-bold">
                    <span>🛡️</span>
                    <span>동시한도 5장</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <span>⏳</span>
                    <span>유효기간 30일</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-orange-700">
                    <span>💳</span>
                    <span>차액 추가결제</span>
                  </div>
                </div>

                {/* Live VIP Ticket Mockup Preview */}
                <div className="pt-1">
                  <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">
                    이웃 사장님들에게 보이는 교환권 미리보기
                  </span>
                  <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full text-amber-100">
                        🎟️ VIP 상생 금액권
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-100">
                        유효기간 D-30
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <h5 className="font-black text-sm tracking-tight">{myStore.storeName} 자유이용권</h5>
                        <p className="text-[10px] text-amber-100 mt-0.5">전 메뉴 / 서비스 자유 선택 (초과 금액 차액 결제)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-yellow-200">{voucherAmount.toLocaleString()}</span>
                        <span className="text-xs font-black text-white ml-0.5">원</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-white/20">
                      {voucherFulfillmentTypes.map((type) => (
                        <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-black/20 rounded">
                          {type === 'PICKUP' ? '🛍️ 직접 픽업' : type === 'DELIVERY' ? '🛵 배달/배송' : '🏢 현장 방문'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                💡 금액 교환권이 비활성화되어 있습니다. 스위치를 켜면 다른 사장님들이 내 매장의 전 메뉴/서비스에 사용 가능한 금액권을 제안받을 수 있습니다.
              </div>
            )}
          </div>

          {/* Section 2 Header */}
          <div className="flex items-center justify-between pt-1 px-1">
            <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-600" />
              <span>개별 지정 메뉴 및 품목 ({items.length}개)</span>
            </h4>
            <span className="text-[11px] text-gray-400">특정 메뉴 지정 교환용</span>
          </div>

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

              {/* 제공 및 이용 방식 (다중 선택) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>제공 및 이용 방식</span>
                    <span className="text-orange-500 font-extrabold">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-gray-400">중복 선택 가능</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentTypes((prev) =>
                        prev.includes('PICKUP') ? prev.filter((t) => t !== 'PICKUP') : [...prev, 'PICKUP']
                      );
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      fulfillmentTypes.includes('PICKUP')
                        ? 'border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-200 shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">🛍️</span>
                    <span className="font-black text-[11px]">직접 픽업</span>
                    <span className="text-[9px] text-gray-400">포장 / 제품수령</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentTypes((prev) =>
                        prev.includes('DELIVERY') ? prev.filter((t) => t !== 'DELIVERY') : [...prev, 'DELIVERY']
                      );
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      fulfillmentTypes.includes('DELIVERY')
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200 shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">🛵</span>
                    <span className="font-black text-[11px]">배달 / 배송</span>
                    <span className="text-[9px] text-gray-400">매장 / 직접배달</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentTypes((prev) =>
                        prev.includes('ON_SITE') ? prev.filter((t) => t !== 'ON_SITE') : [...prev, 'ON_SITE']
                      );
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      fulfillmentTypes.includes('ON_SITE')
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">🏢</span>
                    <span className="font-black text-[11px]">현장 방문 이용</span>
                    <span className="text-[9px] text-gray-400">홀식사 / 시술 / 시설</span>
                  </button>
                </div>
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
                      {/* Fulfillment Badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(item.fulfillmentTypes && item.fulfillmentTypes.length > 0 ? item.fulfillmentTypes : ['PICKUP', 'ON_SITE']).map((type) => {
                          if (type === 'PICKUP') {
                            return (
                              <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 rounded-md">
                                🛍️ 직접픽업
                              </span>
                            );
                          }
                          if (type === 'DELIVERY') {
                            return (
                              <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                🛵 배달/배송
                              </span>
                            );
                          }
                          if (type === 'ON_SITE') {
                            return (
                              <span key={type} className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                                🏢 현장방문
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
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
              <span>{saving ? '저장 중...' : '품목 및 교환권 최종 저장'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
