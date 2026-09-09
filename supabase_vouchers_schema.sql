-- =========================================================================
-- 🎟️ [Trade Me] 1:1 상생 물물교환 교환권(바우처) 전용 테이블 스크립트
-- =========================================================================
-- 
-- 💡 안내:
--  - 본 스크립트 실행은 [선택 사항]입니다.
--  - 현재 Trade Me는 브라우저의 고탄력 로컬 스토리지와 기존 테이블(items, trades, stores)을
--    연동하여 별도 SQL 실행 없이도 교환권 발행/수령/슬라이드 사용이 100% 정상 작동합니다.
--  - 단, 카운터 태블릿, 사장님 스마트폰, PC 등  여러 기기간 완벽한 실시간 클라우드 동기화를
--    원하실 경우 Supabase 대시보드의 [SQL Editor]에 붙여넣고 [Run] 버튼을 눌러주시면 됩니다.
-- =========================================================================

-- 1. issued_vouchers 테이블 생성
CREATE TABLE IF NOT EXISTS public.issued_vouchers (
    id TEXT PRIMARY KEY,
    trade_id TEXT,
    sender_store_id TEXT NOT NULL,
    sender_store_name TEXT NOT NULL,
    sender_owner_name TEXT,
    sender_store_image_url TEXT,
    receiver_store_id TEXT NOT NULL,
    receiver_store_name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'AMOUNT', -- 'AMOUNT' (상생 금액권) 또는 'MENU' (품목 교환권)
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC DEFAULT 0,
    fulfillment_types TEXT[] DEFAULT ARRAY['PICKUP', 'ON_SITE'],
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' (사용 가능), 'USED' (사용 완료), 'EXPIRED' (기간 만료)
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 빠른 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_receiver ON public.issued_vouchers(receiver_store_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_sender ON public.issued_vouchers(sender_store_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_status ON public.issued_vouchers(status);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.issued_vouchers ENABLE ROW LEVEL SECURITY;

-- 4. 공용 접근 정책 (사장님 간 상호 교환권 발급 및 실시간 사용 조회가 가능하도록 허용)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'issued_vouchers' 
        AND policyname = 'Allow public read-write for issued_vouchers'
    ) THEN
        CREATE POLICY "Allow public read-write for issued_vouchers"
        ON public.issued_vouchers
        FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 5. 실시간(Realtime) 변경 감지 활성화 (선택 사항)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issued_vouchers;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- 이미 등록되어 있는 경우 무시
        WHEN others THEN
            NULL;
    END;
END $$;
