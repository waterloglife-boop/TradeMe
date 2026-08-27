import { Store } from '../types/trade';

// Yangsan Bukjeong-dong (경남 양산시 북정서길 25 104호 / 마라위크)
export const MY_STORE_MOCK: Store = {
  id: 'my-store',
  ownerName: '사장님 (마라위크)',
  storeName: '마라위크 (양산 북정점)',
  category: 'CHINESE',
  categoryName: '중식/마라탕',
  address: '경남 양산시 북정서길 25 104호 (북정초등학교 인근)',
  lat: 35.3605,
  lng: 129.0468,
  phone: '055-385-1234',
  isVerified: true,
  breakTimeActive: true,
  breakTimeHours: '15:00 - 17:00',
  rating: 5.0,
  reviewCount: 88,
  storeImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  exchangeItems: [
    {
      id: 'my-item-1',
      storeId: 'my-store',
      type: 'FOOD',
      title: '소고기마라탕 & 꿔바로우 1인세트',
      description: '진하고 알싸한 소고기 마라탕과 겉바속촉 꿔바로우가 포함된 1인 든든 세트입니다.',
      estimatedPrice: 18000,
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80',
      isAvailable: true
    },
    {
      id: 'my-item-2',
      storeId: 'my-store',
      type: 'FOOD',
      title: '소고기마라탕 & 꿔바로우(미니) 2인세트',
      description: '푸짐한 소고기 마라탕 2인분과 쫄깃바삭 미니 꿔바로우 인기 세트입니다.',
      estimatedPrice: 26000,
      imageUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=500&q=80',
      isAvailable: true
    },
    {
      id: 'my-item-3',
      storeId: 'my-store',
      type: 'FOOD',
      title: '소고기마라샹궈 & 꿔바로우(미니) 2인세트',
      description: '불향 가득 볶아낸 소고기 마라샹궈 2인분과 미니 꿔바로우 풀세트입니다.',
      estimatedPrice: 31000,
      imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=500&q=80',
      isAvailable: true
    }
  ]
};

export const INITIAL_STORES: Store[] = [
  MY_STORE_MOCK,
  {
    id: 'store-1',
    ownerName: '박양산 사장님',
    storeName: '북정 숯불 생고기 구이',
    category: 'KOREAN',
    categoryName: '한식',
    address: '경남 양산시 북정서길 32',
    lat: 35.3610,
    lng: 129.0475,
    phone: '055-381-8892',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '14:30 - 17:00',
    rating: 4.9,
    reviewCount: 42,
    storeImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-1-1',
        storeId: 'store-1',
        type: 'FOOD',
        title: '국산 생삼겹살 2인분 (도시락 포장 세트)',
        description: '직화로 구운 생삼겹살, 파채, 야채 모둠 포장 세트입니다.',
        estimatedPrice: 28000,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-6',
    ownerName: '정편의 사장님',
    storeName: 'CU 양산 북정서길점 (편의점)',
    category: 'CONVENIENCE',
    categoryName: '편의점',
    address: '경남 양산시 북정서길 18',
    lat: 35.3600,
    lng: 129.0462,
    phone: '055-383-1212',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '14:00 - 18:00',
    rating: 4.9,
    reviewCount: 50,
    storeImageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-6-1',
        storeId: 'store-6',
        type: 'FOOD',
        title: '신선 삼각김밥 4개 & 프리미엄 도시락 2종 팩',
        description: '당일 수거 신선 도시락(제육/불고기) 및 인기도시락 번들 세트입니다.',
        estimatedPrice: 18000,
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-7',
    ownerName: '박베이커 사장님',
    storeName: '북정 명가 쌀 베이커리',
    category: 'BAKERY',
    categoryName: '베이커리/떡집',
    address: '경남 양산시 북정서길 12',
    lat: 35.3608,
    lng: 129.0458,
    phone: '055-384-8900',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '16:00 - 19:00',
    rating: 5.0,
    reviewCount: 65,
    storeImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-7-1',
        storeId: 'store-7',
        type: 'FOOD',
        title: '당일 생산 갓 구운 쌀 식빵 & 맘모스 빵 세트',
        description: '100% 국산 쌀로 만든 갓 구운 식빵과 맘모스 빵 모둠입니다.',
        estimatedPrice: 24000,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-8',
    ownerName: '윤헤어 사장님',
    storeName: '라온 헤어 & 뷰티 (양산 북정점)',
    category: 'BEAUTY',
    categoryName: '뷰티/케어',
    address: '경남 양산시 북정중앙로 15',
    lat: 35.3598,
    lng: 129.0480,
    phone: '055-383-4455',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '13:00 - 15:00',
    rating: 5.0,
    reviewCount: 78,
    storeImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-8-1',
        storeId: 'store-8',
        type: 'SERVICE',
        title: '프리미엄 두피 스케일링 & 커트 이용권',
        description: '원장 직접 시술 두피 스케일링 케어 및 커트 1회권입니다.',
        estimatedPrice: 45000,
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  }
];
