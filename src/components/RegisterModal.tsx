import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Utensils, Bed, Sparkles, Check } from 'lucide-react';
import { ExchangeItem, ItemType } from '../types/trade';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newItem: Omit<ExchangeItem, 'id' | 'storeId'>) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [title, setTitle] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | ''>(25000);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ItemType>('FOOD');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !estimatedPrice) return;

    onRegister({
      type,
      title,
      description,
      estimatedPrice: Number(estimatedPrice),
      imageUrl,
      isAvailable: true,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    onClose();
  };

  const sampleImages = [
    { label: '한식/고기', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
    { label: '일식/초밥', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80' },
    { label: '양식/파스타', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80' },
    { label: '숙박/펜션', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500 text-white rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                우리 가게 교환 메뉴/서비스 등록
              </h2>
              <p className="text-xs text-gray-500">
                타 매장 사장님과 1:1로 바꿔먹을 2~3가지 대표 품목을 등록하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              품목 카테고리
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('FOOD')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'FOOD'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Utensils className="w-4 h-4" />
                음식 / 메뉴 바꿔먹기
              </button>

              <button
                type="button"
                onClick={() => setType('SERVICE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'SERVICE'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Bed className="w-4 h-4" />
                숙박 / 서비스 교환권
              </button>
            </div>
          </div>

          {/* Menu Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              교환 메뉴 / 서비스명 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 초벌 양념돼지갈비 2인 세트 (도시락)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          {/* Estimated Value / Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              1:1 교환 추정 가치 (원 단위) <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                step="1000"
                placeholder="28000"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold text-gray-900"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-bold">원</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              💡 상대 사장님의 메뉴와 금액이 다를 경우 차액(현금/카드 정산) 계산의 기준이 됩니다.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              메뉴 상세 설명 (구성품, 포장 여부 등)
            </label>
            <textarea
              rows={3}
              placeholder="상추, 특제 양념장 포함. 브레이크 타임 픽업 가능합니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          {/* Sample Image Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              대표 이미지 선택
            </label>
            <div className="grid grid-cols-4 gap-2">
              {sampleImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-lg overflow-hidden border-2 h-16 transition-all ${
                    imageUrl === img.url ? 'border-orange-500 ring-2 ring-orange-400' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-bold py-0.5 truncate">
                    {img.label}
                  </span>
                  {imageUrl === img.url && (
                    <div className="absolute top-1 right-1 bg-orange-500 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              내 교환 메뉴 등록 완료하기
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
