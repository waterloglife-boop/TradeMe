# 🍽️ Trade Me (트레이드 미)

> 소상공인 & 요식업 사장님을 위한 1:1 등가교환 벼룩시장 및 상생 플랫폼

---

## 🚀 주요 기능 (MVP Sprint 1~3)

1. **🗺️ 위치기반 탐색 (Leaflet / Naver Maps API)**
   - 주변 매장 마커 및 **☕ 브레이크 타임 교환 가능 매장 하이라이트**
2. **🍽️ 1:1 음식 & 서비스 등가교환 제안**
   - 대표 메뉴 (2~3가지) 등록 및 자동 차액 계산 (`내가 6,000원 추가 정산` 등)
3. **💬 1:1 실시간 사장님 대화 (Supabase Realtime)**
   - 대화 및 교환 제안서 카드 자동 공유
4. **🔐 사장님 신뢰 인증 & Supabase BaaS**
   - 사업자등록번호 인증 및 Supabase Auth / PostgreSQL Database 연동

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Leaflet / Naver Map SDK
- **Backend / Database**: Supabase BaaS (Auth, Database, Realtime)
- **Deployment**: Vercel (CI/CD)
