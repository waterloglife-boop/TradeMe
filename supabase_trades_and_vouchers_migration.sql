-- =========================================================================
-- 🤝 [Trade Me] 1:1 물물교환 (trades) & 상생 교환권 (issued_vouchers) 통합 마이그레이션 스크립트
-- =========================================================================
-- 
-- 💡 문제 원인 해결:
-- 1. trades 테이블에 누락되었던 필수 컬럼(is_poke, message, trade_type 등)을 추가합니다.
-- 2. exchange_items 외래키 제약조건으로 인해 제안서 저장이 차단되던 현상을 해결합니다.
-- 3. 실시간(Realtime) 소켓을 활성화하여 상대방이 [수락] 시 즉시 양측 화면에 '체결 완료'로 동기화됩니다.
-- 4. issued_vouchers(상생 교환권) 테이블을 완벽히 생성하고 RLS 정책을 부여합니다.
-- 
-- 🚀 적용 방법:
-- Supabase 대시보드 (https://supabase.com/dashboard) 접속
-- -> 좌측 메뉴 [SQL Editor] 클릭
-- -> 본 스크립트 전체를 복사하여 붙여넣은 후 [Run] 클릭!
-- =========================================================================

-- 1. trades 테이블의 제약조건 완화 (유연한 상점/아이템 교환 지원)
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_requester_item_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_target_item_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_requester_store_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_target_store_id_fkey;

-- 2. trades 테이블에 누락된 필수 컬럼 추가
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS is_poke BOOLEAN DEFAULT false;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'VOUCHER';
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS trade_fulfillment TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS requester_store_name TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS requester_owner_name TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS requester_item_title TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS requester_item_image_url TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS requester_item_price NUMERIC;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS target_store_name TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS target_owner_name TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS target_item_title TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS target_item_image_url TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS target_item_price NUMERIC;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. trades 테이블 인덱스 및 RLS 권한 설정
CREATE INDEX IF NOT EXISTS idx_trades_requester ON public.trades(requester_store_id);
CREATE INDEX IF NOT EXISTS idx_trades_target ON public.trades(target_store_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'trades' 
        AND policyname = 'Allow public full access for trades'
    ) THEN
        CREATE POLICY "Allow public full access for trades"
        ON public.trades
        FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 4. issued_vouchers (상생 교환권 보관함) 테이블 생성 및 RLS
CREATE TABLE IF NOT EXISTS public.issued_vouchers (
    id TEXT PRIMARY KEY,
    trade_id TEXT,
    sender_store_id TEXT NOT NULL,
    sender_store_name TEXT NOT NULL,
    sender_owner_name TEXT,
    sender_store_image_url TEXT,
    receiver_store_id TEXT NOT NULL,
    receiver_store_name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'AMOUNT',
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC DEFAULT 0,
    fulfillment_types TEXT[] DEFAULT ARRAY['PICKUP', 'ON_SITE'],
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issued_vouchers_receiver ON public.issued_vouchers(receiver_store_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_sender ON public.issued_vouchers(sender_store_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_status ON public.issued_vouchers(status);

ALTER TABLE public.issued_vouchers ENABLE ROW LEVEL SECURITY;

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

-- 5. chat_messages 테이블 RLS 권한 확인
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Allow public full access for chat_messages'
    ) THEN
        CREATE POLICY "Allow public full access for chat_messages"
        ON public.chat_messages
        FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 6. Supabase Realtime (실시간 소켓) 구독 활성화
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issued_vouchers;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
    END;
END $$;
