-- Trade Me Database Schema (PostgreSQL / SQLite)

-- 1. Users Table (소상공인 사장님 계정)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    owner_name VARCHAR(50) NOT NULL,
    business_number VARCHAR(20) NOT NULL, -- 사업자등록번호
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Stores Table (가게 프로필 및 위치 데이터)
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    store_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- KOREAN, JAPANESE, WESTERN, ACCOMMODATION, CAFE
    address VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    break_time_active BOOLEAN DEFAULT FALSE, -- 브레이크타임 (교환가능) 상태
    break_time_hours VARCHAR(50),
    store_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ExchangeItems Table (1:1 바꿔먹을 메뉴 및 서비스)
CREATE TABLE IF NOT EXISTS exchange_items (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) REFERENCES stores(id),
    item_type VARCHAR(20) NOT NULL, -- FOOD, SERVICE
    title VARCHAR(150) NOT NULL,
    description TEXT,
    estimated_price INTEGER NOT NULL, -- 원 단위 추정가
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TradeProposals Table (1:1 등가교환 제안서)
CREATE TABLE IF NOT EXISTS trade_proposals (
    id VARCHAR(50) PRIMARY KEY,
    requester_store_id VARCHAR(50) REFERENCES stores(id),
    target_store_id VARCHAR(50) REFERENCES stores(id),
    offered_item_id VARCHAR(50) REFERENCES exchange_items(id),
    requested_item_id VARCHAR(50) REFERENCES exchange_items(id),
    price_difference INTEGER NOT NULL, -- 차액
    pickup_time VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ChatMessages Table (1:1 실시간 대화)
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    trade_proposal_id VARCHAR(50) REFERENCES trade_proposals(id),
    sender_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
