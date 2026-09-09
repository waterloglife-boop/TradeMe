import React from 'react';
import { X, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-gray-900">
              트레이드미(TradeMe) 서비스 이용약관 및 통신판매중개 면책 조항
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 leading-relaxed font-sans">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold">
            📢 [필독] 트레이드미는 전자상거래 등에서의 소비자보호에 관한 법률 제20조 제2항에 따른 &apos;통신판매중개자&apos;로서 회원 간 물물교환 및 교환권 거래의 당사자가 아닙니다.
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">1</span>
              제1조 (통신판매중개자로서의 법적 지위)
            </h4>
            <p className="text-gray-600 pl-6">
              트레이드미(이하 &apos;플랫폼&apos;)는 등록된 자영업자·소상공인 회원(이하 &apos;회원&apos;) 간 보유 물품 및 서비스 이용권(모바일 교환권)의 자율적인 상호 교환을 원활히 할 수 있도록 시스템 플랫폼을 제공하는 <strong>통신판매중개자</strong>입니다. 플랫폼은 개별 거래의 주체나 계약 당사자가 아니며, 거래 물품 및 교환권의 실제 이행 여부에 대해 직접 책임을 지지 않습니다.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">2</span>
              제2조 (교환권 자율 발행 및 금융 지급보증 배제)
            </h4>
            <p className="text-gray-600 pl-6">
              회원이 플랫폼을 통해 생성·발행하는 모든 교환권은 각 가맹 사업자가 본인의 영업 자산과 신용을 기반으로 <strong>자율적으로 발행</strong>하는 것입니다. 플랫폼은 금융기관, 신용보증기금 또는 결제대행업자가 아니며, 발행된 교환권에 대하여 예금자보호법, 전자금융거래법 등에 따른 <strong>어떠한 지급보증·지급준비금 예치 의무도 부담하지 않습니다.</strong>
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">3</span>
              제3조 (뱅크런·부도·폐업 및 채무불이행 시 면책)
            </h4>
            <div className="text-gray-600 pl-6 space-y-1.5">
              <p>
                ① 특정 회원 매장의 과도한 교환권 발행, 경영 악화, 고의 폐업, 부도, 야반도주, <strong>뱅크런(동시다발적 교환 요구 불능)</strong> 등으로 인하여 교환권의 사용이 거부되거나 채무가 불이행되는 경우, 그에 따른 모든 민·형사상 법적 책임 및 원상회복 의무는 <strong>교환권을 발행한 사업자 당사자</strong>에게 귀속됩니다.
              </p>
              <p>
                ② 플랫폼은 관계 법령에 위배되지 않는 한 회원 간 발생한 부도·불이행 손해에 대하여 <strong>대위변제, 환불, 손해배상 등의 법적 책임을 전면 면책</strong>합니다.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">4</span>
              제4조 (플랫폼 안전 장치 및 리스크 관리 조치)
            </h4>
            <div className="text-gray-600 pl-6 space-y-1">
              <p>
                플랫폼은 선량한 사장님들의 피해 방지와 먹튀·사기 행위 근절을 위하여 다음과 같은 안전망을 운영하며, 회원은 이에 동의합니다:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[11px] text-gray-500">
                <li>국세청(NTS) 공식 API를 통한 사업자등록번호·대표자명·개업일자 3-Way 실시간 1:1 진위확인</li>
                <li>악의적 교환권 남발을 방지하기 위한 계정당 최대 동시 교환권 발행·보유 5장 상한선 제한</li>
                <li>불이행 신고 접수 시 즉각적인 계정 영구 제명 및 국세청 사업자 정보 기반 형사고발 조치 협조</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-sky-50/70">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-gray-900">
              트레이드미(TradeMe) 개인정보처리방침
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 leading-relaxed font-sans">
          <p className="text-gray-600">
            TradeMe(이하 &apos;회사&apos;)는 개인정보보호법 등 관련 법령에 따라 정보주체의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">1. 개인정보의 수집 및 이용 목적</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-0.5">
              <li>회원 가입 및 본인 확인, 소상공인 사업자 진위 확인 (국세청 API 연동)</li>
              <li>1:1 물물교환 제안 및 상생 교환권 발행·사용 내역 관리</li>
              <li>물물교환 매칭 알림 및 고객 문의/고충 처리</li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">2. 수집하는 개인정보의 항목</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-0.5">
              <li>필수항목: 대표자 성명, 상호명, 이메일, 비밀번호, 연락처, 사업자등록번호, 개업연월일, 사업장 주소(좌표)</li>
              <li>선택항목: 매장 대표 사진, 교환 등록 물품 사진 및 가격</li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">3. 개인정보의 보유 및 이용 기간</h4>
            <p className="text-gray-600">
              회원 탈퇴 시까지 보유 및 이용하며, 전자상거래법 등 관계 법령에 따라 거래 기록은 최대 5년간 안전하게 분리 보관 후 파기합니다.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">4. 개인정보의 제3자 제공</h4>
            <p className="text-gray-600">
              회사는 정보주체의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 사업자 진위 확인을 위한 국세청 공공데이터 API 전송 및 법령에 정해진 의무 사항은 예외로 합니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
