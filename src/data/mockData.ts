import { Store } from '../types/trade';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    ownerName: '박해운 사장님',
    storeName: '송정 짚불 숯불갈비',
    category: 'KOREAN',
    categoryName: '한식/숯불구이',
    address: '부산 해운대구 송정광어골로 35',
    lat: 35.1785,
    lng: 129.1990,
    phone: '051-701-8892',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '14:30 - 17:00',
    rating: 4.9,
    reviewCount: 38,
    storeImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-1-1',
        storeId: 'store-1',
        type: 'FOOD',
        title: '초벌 수제 양념돼지갈비 2인분 (도시락 세트)',
        description: '참숯 직화로 구워 파채, 상추, 특제 양념장과 함께 포장해 드립니다.',
        estimatedPrice: 32000,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      },
      {
        id: 'item-1-2',
        storeId: 'store-1',
        type: 'FOOD',
        title: '한우 된장찌개 & 육회비빔밥 2인 세트',
        description: '지리산 한우를 듬뿍 넣은 칼칼한 된장찌개와 싱싱한 육회비빔밥입니다.',
        estimatedPrice: 28000,
        imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-6',
    ownerName: '정편의 사장님',
    storeName: 'CU 송정 해수욕장점 (편의점)',
    category: 'CONVENIENCE',
    categoryName: '편의점/신선식품',
    address: '부산 해운대구 송정해변로 28',
    lat: 35.1780,
    lng: 129.2002,
    phone: '051-703-1212',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '14:00 - 18:00',
    rating: 4.9,
    reviewCount: 47,
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
      },
      {
        id: 'item-6-2',
        storeId: 'store-6',
        type: 'FOOD',
        title: '클럽 샌드위치 & 햄버거 4종 간식 팩',
        description: '케이준 치킨 샌드위치, 더블 패티 햄버거 4개 구성 간식 팩.',
        estimatedPrice: 16000,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-7',
    ownerName: '박베이커 사장님',
    storeName: '명가 수제 쌀 베이커리',
    category: 'BAKERY',
    categoryName: '베이커리/빵',
    address: '부산 해운대구 송정중앙로 18',
    lat: 35.1771,
    lng: 129.1970,
    phone: '051-704-8900',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '16:00 - 19:00',
    rating: 5.0,
    reviewCount: 63,
    storeImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-7-1',
        storeId: 'store-7',
        type: 'FOOD',
        title: '당일 생산 갓 구운 쌀 식빵 & 맘모스 빵 세트',
        description: '100% 국산 쌀로 만든 갓 구운 식빵, 밤식빵, 맘모스 빵 모둠입니다.',
        estimatedPrice: 24000,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      },
      {
        id: 'item-7-2',
        storeId: 'store-7',
        type: 'FOOD',
        title: '수제 앙버터 & 크루아상 6종 디저트 팩',
        description: '프랑스 고메버터 앙버터, 초코 크루아상 6가지 프리미엄 빵 팩.',
        estimatedPrice: 22000,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-2',
    ownerName: '최서핑 사장님',
    storeName: '송정 오션스테이 펜션 & 리조트',
    category: 'ACCOMMODATION',
    categoryName: '숙박/펜션',
    address: '부산 해운대구 송정해변로 18',
    lat: 35.1792,
    lng: 129.2015,
    phone: '051-704-5000',
    isVerified: true,
    breakTimeActive: false,
    breakTimeHours: '12:00 - 15:00',
    rating: 4.8,
    reviewCount: 52,
    storeImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-2-1',
        storeId: 'store-2',
        type: 'SERVICE',
        title: '평일 오션뷰 객실 1박 숙박 이용권 (2인 기준)',
        description: '송정 바다가 한눈에 보이는 주중 1박 이용권입니다. (10만원 상당 교환)',
        estimatedPrice: 100000,
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      },
      {
        id: 'item-2-2',
        storeId: 'store-2',
        type: 'SERVICE',
        title: '서핑 강습 & 렌탈 2인 풀패키지권',
        description: '전문 강사의 1:1 서핑 강습 및 슈트/보드 렌탈 포함입니다.',
        estimatedPrice: 80000,
        imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-3',
    ownerName: '김스시 사장님',
    storeName: '미에도 오마카세 스시',
    category: 'JAPANESE',
    categoryName: '일식/초밥',
    address: '부산 해운대구 송정중앙로 12',
    lat: 35.1768,
    lng: 129.1965,
    phone: '051-702-1234',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '15:00 - 17:00',
    rating: 5.0,
    reviewCount: 41,
    storeImageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-3-1',
        storeId: 'store-3',
        type: 'FOOD',
        title: '특선 모듬초밥 14pcs & 후토마끼 2개 (포장)',
        description: '참다랑어 가마도로, 성게알, 단새우, 생연어 등 최고급 구성.',
        estimatedPrice: 35000,
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  }
];

export const MY_STORE_MOCK: Store = {
  id: 'my-store',
  ownerName: '홍길동 사장님 (나)',
  storeName: '원조 송정 수제돈까스',
  category: 'KOREAN',
  categoryName: '한식/돈까스',
  address: '부산 해운대구 송정중앙로 22',
  lat: 35.1775,
  lng: 129.1978,
  phone: '010-1234-5678',
  isVerified: true,
  breakTimeActive: true,
  breakTimeHours: '15:00 - 17:00',
  rating: 4.9,
  reviewCount: 45,
  storeImageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
  exchangeItems: [
    {
      id: 'my-item-1',
      storeId: 'my-store',
      type: 'FOOD',
      title: '왕 수제 등심돈까스 & 쫄면 세트 2인분',
      description: '매일 아침 직접 망치로 두드린 한돈 등심과 매콤달콤 쫄면 구성입니다.',
      estimatedPrice: 26000,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80',
      isAvailable: true
    },
    {
      id: 'my-item-2',
      storeId: 'my-store',
      type: 'FOOD',
      title: '치즈 폭포 돈까스 & 모밀 2인 세트',
      description: '모짜렐라 치즈가 가득한 치즈돈까스와 시원한 냉모밀입니다.',
      estimatedPrice: 29000,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80',
      isAvailable: true
    }
  ]
};
