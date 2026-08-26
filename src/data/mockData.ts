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
      },
      {
        id: 'item-3-2',
        storeId: 'store-3',
        type: 'FOOD',
        title: '메로구이 & 연어 머리 소금구이 세트',
        description: '고소하고 달콤한 특제 간장 메로구이와 사케 안주 세트입니다.',
        estimatedPrice: 30000,
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-4',
    ownerName: '이파스타 사장님',
    storeName: '볼로냐 1988 트라토리아',
    category: 'WESTERN',
    categoryName: '양식/파스타',
    address: '부산 해운대구 송정3길 9',
    lat: 35.1805,
    lng: 129.1982,
    phone: '051-703-9911',
    isVerified: true,
    breakTimeActive: true,
    breakTimeHours: '15:00 - 17:00',
    rating: 4.7,
    reviewCount: 29,
    storeImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-4-1',
        storeId: 'store-4',
        type: 'FOOD',
        title: '수제 생면 트러플 파스타 & 콰트로 피자',
        description: '이탈리아 생면과 생트러플 향 가득한 파스타, 화덕 피자 세트.',
        estimatedPrice: 34000,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-5',
    ownerName: '정바리스타 사장님',
    storeName: '웨이브 로스터리 로스터스',
    category: 'CAFE',
    categoryName: '카페/디저트',
    address: '부산 해운대구 송정광어골로 48',
    lat: 35.1812,
    lng: 129.2028,
    phone: '051-705-3322',
    isVerified: true,
    breakTimeActive: false,
    breakTimeHours: '14:00 - 16:00',
    rating: 4.9,
    reviewCount: 64,
    storeImageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    exchangeItems: [
      {
        id: 'item-5-1',
        storeId: 'store-5',
        type: 'FOOD',
        title: '스페셜티 원두 200g 2팩 & 수제 크로플 4개',
        description: '직접 로스팅한 에티오피아 예가체프 원두와 프랑스 버터 크로플.',
        estimatedPrice: 30000,
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=80',
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
