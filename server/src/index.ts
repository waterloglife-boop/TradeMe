import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Trade Me Backend REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Authentication API Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    token: 'mock-jwt-token-trademe-12345',
    user: {
      id: 'usr-1',
      email,
      ownerName: '홍길동 사장님',
      storeName: '원조 송정 수제돈까스',
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, ownerName, storeName, businessNumber } = req.body;
  res.json({
    success: true,
    message: '소상공인 사장님 회원가입이 성공적으로 완료 되었습니다.',
    user: {
      id: `usr-${Date.now()}`,
      email,
      ownerName,
      storeName,
      businessNumber,
    },
  });
});

// Stores API Routes
app.get('/api/stores', (req, res) => {
  res.json({
    success: true,
    message: '가게 목록 조회 성공',
    data: [
      {
        id: 'store-1',
        ownerName: '박해운 사장님',
        storeName: '송정 짚불 숯불갈비',
        category: 'KOREAN',
        address: '부산 해운대구 송정광어골로 35',
        lat: 35.1785,
        lng: 129.1990,
        breakTimeActive: true,
      },
    ],
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Trade Me Backend Server running on http://localhost:${PORT}`);
});
