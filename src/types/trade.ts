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
