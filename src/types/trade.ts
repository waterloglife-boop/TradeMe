export type ItemType = 'FOOD' | 'SERVICE' | 'ITEM';

export type StoreCategory = 
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

export interface ExchangeItem {
  id: string;
  storeId: string;
  type: ItemType;
  title: string;
  description: string;
  estimatedPrice: number; // 원 단위 (예: 15000)
  imageUrl: string;
  isAvailable: boolean;
}

export type MenuTestFeedbackType = 'BLOG_SNS' | 'SECRET_REPORT' | 'BOTH';

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

  // 🧪 [신메뉴/신규서비스 체험단 & 리뷰 품앗이]
  isMenuTesting?: boolean; // 신메뉴 테스트 모집 진행 여부
  menuTestTitle?: string; // 신메뉴 명
  menuTestReward?: string; // 제공 혜택 (예: 신메뉴 2인 무료 시식)
  menuTestQuota?: number; // 모집 인원 (예: 5명)
  menuTestApplicantCount?: number; // 현재 신청자 수
  menuTestFeedbackType?: MenuTestFeedbackType; // 희망 피드백 방식
  menuTestDescription?: string; // 테스트 취지 및 안내 문구
}

export interface MenuTestApplication {
  id: string;
  storeId: string;
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
  priceDifference: number; // 0, 양수(내가 더 냄), 음수(상대가 더 냄)
  proposedTime: string;
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
