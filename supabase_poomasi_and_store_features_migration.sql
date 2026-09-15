-- =========================================================================
-- ⭐ [Trade Me] 가게 소개글 & 네이버 플레이스 품앗이 & 체험단 & 고객문의
-- 🚀 Supabase 통합 데이터베이스 마이그레이션 스크립트 (2026-09-15)
-- =========================================================================
-- 
-- 📌 본 스크립트가 적용하는 주요 항목:
-- 1. [가게 소개글 & 상태 컬럼]: stores 테이블에 description(가게소개/인사말) 및 부가 컬럼 추가
-- 2. [네이버 플레이스 품앗이 매장]: naver_poomasi_stores 테이블 생성 (경고 횟수, 차단 여부 등)
-- 3. [네이버 플레이스 맞저장 요청/이력]: naver_poomasi_requests 테이블 생성 (신고, 상태 관리 등)
-- 4. [저장수 원자적 증가 RPC 함수]: increment_poomasi_save_count 함수 정의
-- 5. [신메뉴 시식단 & 체험단 지원서]: menu_test_applications 테이블 및 인덱스 생성
-- 6. [원클릭 고객지원 & 소명 문의 접수]: customer_inquiries 테이블 및 인덱스 생성
-- 7. [RLS 보안 정책 및 Realtime]: 공용 읽기/쓰기 허용 및 실시간 소켓 연동
-- 
-- 🛠️ 실행 방법:
-- 1. Supabase 대시보드 (https://supabase.com/dashboard) 로그인
-- 2. 사용 중인 프로젝트 선택 ➔ 좌측 사이드바 [SQL Editor] 클릭
-- 3. [New query] 클릭 후 본 스크립트 전체를 복사하여 붙여넣기
-- 4. 우측 하단 [Run] (또는 Ctrl + Enter) 클릭!
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. stores 테이블에 가게 소개글(description) 및 최신 컬럼 추가
-- -------------------------------------------------------------------------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS menu_test_applicant_count INTEGER DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS trade_count INTEGER DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS category_name TEXT DEFAULT '';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS break_time_active BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- -------------------------------------------------------------------------
-- 2. 네이버 플레이스 저장 품앗이 등록 가맹점 테이블 (naver_poomasi_stores)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.naver_poomasi_stores (
    id TEXT PRIMARY KEY,
    store_name TEXT NOT NULL,
    owner_name TEXT,
    category_name TEXT DEFAULT '외식업',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    store_image_url TEXT DEFAULT '',
    place_url TEXT NOT NULL,
    message TEXT DEFAULT '확인 즉시 100% 맞저장 갑니다!',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    save_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poomasi_stores_registered ON public.naver_poomasi_stores(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_poomasi_stores_warning ON public.naver_poomasi_stores(warning_count);
CREATE INDEX IF NOT EXISTS idx_poomasi_stores_blocked ON public.naver_poomasi_stores(is_blocked);

-- -------------------------------------------------------------------------
-- 3. 네이버 플레이스 맞저장 요청/내역 테이블 (naver_poomasi_requests)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.naver_poomasi_requests (
    id TEXT PRIMARY KEY,
    from_store_id TEXT NOT NULL,
    from_store_name TEXT NOT NULL,
    from_owner_name TEXT,
    from_place_url TEXT,
    to_store_id TEXT NOT NULL,
    to_store_name TEXT NOT NULL,
    to_place_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    report_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_poomasi_req_to_store ON public.naver_poomasi_requests(to_store_id);
CREATE INDEX IF NOT EXISTS idx_poomasi_req_from_store ON public.naver_poomasi_requests(from_store_id);
CREATE INDEX IF NOT EXISTS idx_poomasi_req_status ON public.naver_poomasi_requests(status);

-- -------------------------------------------------------------------------
-- 4. 저장 횟수 1 증가 안전 RPC 프로시저 (increment_poomasi_save_count)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_poomasi_save_count(target_store_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.naver_poomasi_stores
    SET save_count = COALESCE(save_count, 0) + 1,
        updated_at = NOW()
    WHERE id = target_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- 5. 신메뉴 시식단 & 체험단 지원서 테이블 (menu_test_applications)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_test_applications (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    campaign_id TEXT,
    campaign_title TEXT,
    applicant_user_id TEXT,
    applicant_store_name TEXT,
    applicant_owner_name TEXT,
    applicant_phone TEXT,
    sns_url TEXT,
    message TEXT,
    feedback_type TEXT DEFAULT 'BOTH',
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_apps_store ON public.menu_test_applications(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_apps_user ON public.menu_test_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_menu_apps_status ON public.menu_test_applications(status);

-- -------------------------------------------------------------------------
-- 6. 원클릭 고객 문의 & 차단 소명 접수 테이블 (customer_inquiries)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    sender_name TEXT,
    sender_contact TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.customer_inquiries(created_at DESC);

-- -------------------------------------------------------------------------
-- 7. Row Level Security (RLS) 권한 설정 (누구나 읽기/등록/수정 가능하도록 허용)
-- -------------------------------------------------------------------------
ALTER TABLE public.naver_poomasi_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for naver_poomasi_stores" ON public.naver_poomasi_stores;
CREATE POLICY "Allow public access for naver_poomasi_stores" 
ON public.naver_poomasi_stores FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.naver_poomasi_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for naver_poomasi_requests" ON public.naver_poomasi_requests;
CREATE POLICY "Allow public access for naver_poomasi_requests" 
ON public.naver_poomasi_requests FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for customer_inquiries" ON public.customer_inquiries;
CREATE POLICY "Allow public access for customer_inquiries" 
ON public.customer_inquiries FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.menu_test_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for menu_test_applications" ON public.menu_test_applications;
CREATE POLICY "Allow public access for menu_test_applications" 
ON public.menu_test_applications FOR ALL TO public USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 8. 실시간(Realtime) 소켓 동기화 채널 등록
-- -------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.naver_poomasi_stores;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.naver_poomasi_requests;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_inquiries;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_test_applications;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
