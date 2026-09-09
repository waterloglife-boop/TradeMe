import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Bug, HelpCircle, Lightbulb, Handshake } from 'lucide-react';
import { InquiryType } from '../types/trade';
import { createCustomerInquiry } from '../lib/supabase';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: InquiryType;
  defaultSenderName?: string;
}

const TYPE_CONFIG: Record<
  InquiryType,
  { label: string; icon: any; color: string; bg: string; border: string; desc: string }
> = {
  BUG: {
    label: '버그 & 오류 신고',
    icon: Bug,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    desc: '화면 깨짐, 기능 오작동 등 발생한 문제를 제보해 주시면 신속히 조치하겠습니다.',
  },
  INQUIRY: {
    label: '문의사항 남기기',
    icon: HelpCircle,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    desc: '서비스 이용 방법, 물물교환 및 교환권 관련 궁금한 점을 편하게 남겨주세요.',
  },
  FEATURE: {
    label: '기능 개선 제안',
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    desc: '사장님들의 장사에 실질적인 도움이 될 아이디어나 편의 기능 제안을 환영합니다.',
  },
  PARTNERSHIP: {
    label: '제휴·광고 제안',
    icon: Handshake,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    desc: '식자재 공급, B2B 서비스, 배너 입점 등 소상공인 상생 제휴 및 광고 집행을 문의하세요.',
  },
};

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'INQUIRY',
  defaultSenderName = '',
}) => {
  const [type, setType] = useState<InquiryType>(defaultType);
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderContact, setSenderContact] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      if (defaultSenderName) setSenderName(defaultSenderName);
      setSubmitted(false);
    }
  }, [isOpen, defaultType, defaultSenderName]);

  if (!isOpen) return null;

  const currentCfg = TYPE_CONFIG[type];
  const IconComp = currentCfg.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createCustomerInquiry({
      type,
      senderName: senderName.trim() || '익명 사장님',
      senderContact: senderContact.trim() || '연락처 미기재',
      title: title.trim(),
      content: content.trim(),
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setTitle('');
      setContent('');
      setSubmitted(false);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${currentCfg.bg} ${currentCfg.color} flex items-center justify-center font-black shadow-inner`}>
              <IconComp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">원클릭 고객 지원 & 제휴 센터</h3>
              <p className="text-[11px] text-gray-400">TradeMe 운영진에게 바로 전달되는 실시간 접수창</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-black text-base text-gray-900">소중한 의견이 정상 접수되었습니다!</h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              운영진이 실시간으로 확인 후 기재해주신 연락처로 정성껏 안내해 드리겠습니다. 감사합니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
            
            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(TYPE_CONFIG) as InquiryType[]).map((tKey) => {
                const cfg = TYPE_CONFIG[tKey];
                const TIcon = cfg.icon;
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ring-orange-500/20 shadow-xs scale-[1.02]`
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TIcon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Description Banner */}
            <div className={`p-3 rounded-2xl border text-[11px] font-medium leading-relaxed ${currentCfg.bg} ${currentCfg.border} ${currentCfg.color}`}>
              💡 {currentCfg.desc}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">성함 / 상호명</label>
                <input
                  type="text"
                  placeholder="예: 홍길동 사장님 (송정 수제돈까스)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">연락처 (휴대폰 / 이메일)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 010-1234-5678 또는 이메일"
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">제목</label>
              <input
                type="text"
                required
                placeholder="제목을 간략히 입력해 주세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">상세 내용</label>
              <textarea
                required
                rows={4}
                placeholder="내용을 자유롭게 적어주세요. (화면 오류의 경우 발생 시간대나 기기 종류를 적어주시면 빠른 해결에 도움이 됩니다)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-normal resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                접수된 내용은 웹마스터 관리자 커맨드 센터로 즉시 전송됩니다.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>접수하기</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
