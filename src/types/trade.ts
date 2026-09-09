export type ItemType = 'FOOD' | 'SERVICE' | 'ITEM' | 'VOUCHER';

export type StoreCategory = 
  | 'FOOD'
  | 'KOREAN' 
  | 'JAPANESE' 
  | 'WESTERN' 
  | 'CHINESE' 
  | 'SNACK' 
  | 'CAFE' 
  | 'PUB' 
  | 'CONVENIENCE' 
  | 'BAKERY' 
  | 'FRESH_FOOD' 
  | 'BEAUTY' 
  | 'ACCOMMODATION' 
  | 'LEISURE' 
  | 'LAUNDRY' 
  | 'FITNESS' 
  | 'OTHER';

export type FulfillmentType = 'PICKUP' | 'DELIVERY' | 'ON_SITE';

export interface ExchangeItem {
  id: string;
  storeId: string;
  type: ItemType;
  title: string;
  description: string;
  estimatedPrice: number; // 원 단위 (예: 15000)
  imageUrl: string;
  isAvailable: boolean;
  fulfillmentTypes?: FulfillmentType[]; // ['PICKUP', 'DELIVERY', 'ON_SITE']
  isVoucher?: boolean; // 상생 금액 교환권 여부
}

export type MenuTestFeedbackType = 'BLOG_SNS' | 'SECRET_REPORT' | 'BOTH';

export interface MenuTestCampaign {
  id: string;
  storeId: string;
  title: string;
  reward: string;
  quota: number;
  applicantCount?: number;
  acceptedCount?: number;
  feedbackType: MenuTestFeedbackType;
  imageUrl?: string;
  description?: string;
  status: 'RECRUITING' | 'CLOSED';
  createdAt: string;
}

export interface Store {
  id: string;
  userId?: string; // 회원 프로필(profiles / auth.users) 연동 ID
  ownerName: string;
  storeName: string;
  category: StoreCategory;
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  phone: string;
  isVerified: boolean; // 사업자 인증 여부
  breakTimeActive: boolean; // 현재 브레이크 타임 (교환 가능 상태) 여부
  breakTimeHours: string; // 예: "14:30 - 17:00"
  storeImageUrl: string;
  exchangeItems: ExchangeItem[];
  rating: number;
  reviewCount: number;

  // 🧪 [신메뉴/신규서비스 체험단 & 리뷰 품앗이] (최대 2개 동시 모집 지원)
  isMenuTesting?: boolean; // 신메뉴 테스트 모집 진행 여부
  menuTestTitle?: string; // 대표 신메뉴 명 (하위 호환)
  menuTestReward?: string; // 제공 혜택
  menuTestQuota?: number; // 모집 인원
  menuTestApplicantCount?: number; // 현재 신청자 수
  menuTestFeedbackType?: MenuTestFeedbackType; // 희망 피드백 방식
  menuTestDescription?: string; // 테스트 취지 및 안내 문구
  menuTestImageUrl?: string; // 신메뉴 사진 URL
  menuTestCampaigns?: MenuTestCampaign[]; // 최대 2개 동시 모집 캠페인 목록

  // 🎟️ [상생 금액 교환권 (상품권) 설정]
  voucherActive?: boolean; // 매장 금액권 발행 활성화 여부
  voucherAmount?: number; // 금액 (예: 20000)
  voucherMaxIssue?: number; // 동시 발행 유통 한도 (기본 3)
  voucherFulfillmentTypes?: FulfillmentType[]; // 수령/이용 방식
}

export interface MenuTestApplication {
  id: string;
  storeId: string;
  campaignId?: string; // 어떤 신메뉴 캠페인에 지원했는지 식별 ID
  campaignTitle?: string; // 지원한 신메뉴 캠페인명
  applicantUserId?: string;
  applicantStoreName: string;
  applicantOwnerName: string;
  applicantPhone: string;
  snsUrl?: string;
  message: string;
  feedbackType: MenuTestFeedbackType;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface TradeProposal {
  id: string;
  myStoreId: string;
  targetStoreId: string;
  myExchangeItemId: string;
  targetExchangeItemId: string;
  myStoreName?: string;
  myOwnerName?: string;
  myItemTitle?: string;
  myItemImageUrl?: string;
  myItemPrice?: number;
  targetStoreName?: string;
  targetOwnerName?: string;
  targetItemTitle?: string;
  targetItemImageUrl?: string;
  targetItemPrice?: number;
  priceDifference: number; // 0, 양수(내가 더 냄), 음수(상대가 더 냄)
  proposedTime: string;
  isPoke?: boolean; // 👉 비동기 찔러보기 여부 (상대 매장이 교환 OFF 상태일 때)
  tradeType?: 'VOUCHER' | 'DIRECT'; // 🎟️ 교환권 맞발행 vs 직접 현장 교환
  tradeFulfillment?: string; // 희망 이용/수령 방식
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isMe: boolean;
  systemAction?: 'PROPOSAL' | 'ACCEPT' | 'COMPLETED';
}

// ☕ [사장님 사랑방] 올인원 커뮤니티 타입 정의
export type CommunityCategory = 'DAILY_TALK' | 'URGENT_TRADE' | 'TIPS_QNA';

export interface CommunityPost {
  id: string;
  storeId?: string;
  authorName: string;
  storeName: string;
  isAnonymous: boolean;
  category: CommunityCategory;
  title: string;
  content: string;
  imageUrl?: string;
  urgentExchangeItem?: string; // 🚨 마감 번개교환 품목
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  storeId?: string;
  authorName: string;
  storeName: string;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
}

// 🎟️ [상생 교환권 보관함] 발행된 교환권 / 상품권 모델 (Phase 3)
export type VoucherStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';

export interface IssuedVoucher {
  id: string;
  tradeId?: string; // 연결된 물물교환 제안 ID
  senderStoreId: string; // 발행한 매장 ID
  senderStoreName: string; // 발행 매장명 (예: 소담 한정식)
  senderOwnerName: string; // 발행 사장님 성함
  senderStoreImageUrl?: string;
  receiverStoreId: string; // 교환권을 받은 매장 ID (내 매장)
  receiverStoreName: string; // 교환권을 받은 매장명
  type: 'AMOUNT' | 'MENU'; // 금액권 vs 지정 메뉴 교환권
  title: string; // 쿠폰 타이틀 (예: '소담 한정식 20,000원 상생 이용권' 또는 '보리굴비 정식 2인 교환권')
  description?: string; // 상세 안내
  amount: number; // 가치/금액 (예: 20000)
  fulfillmentTypes: FulfillmentType[]; // ['PICKUP', 'ON_SITE', ...]
  issuedAt: string; // 발행 일시 (ISO)
  expiresAt: string; // 만료 일시 (발행일 + 30일, ISO)
  status: VoucherStatus; // AVAILABLE | USED | EXPIRED
  usedAt?: string; // 사용 일시 (ISO)
}

// 🎧 [원클릭 문의 및 오류, 제휴·광고 제안] (푸터 연동 모델)
export type InquiryType = 'BUG' | 'INQUIRY' | 'FEATURE' | 'PARTNERSHIP';

export interface CustomerInquiry {
  id: string;
  type: InquiryType;
  senderName: string;
  senderContact: string;
  title: string;
  content: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

// 📈 [쿠팡 파트너스 & 4대 핵심 배너 통계 및 링크 관리]
export type AdBannerKey = 'TOP_MAIN' | 'COMMUNITY_FEED' | 'STORE_DRAWER' | 'WALLET_FOOTER';

export interface AdBannerStat {
  id: string;
  key: AdBannerKey;
  icon: string;
  name: string;
  targetCategory: string;
  impressions: number;
  clicks: number;
  ctr: number; // percentage
  estimatedRevenue: number; // KRW
  lastClickedAt?: string;
  coupangUrl: string;
}
