import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      // Naver Geocoding REST API CORS 우회 프록시 (개발서버 전용)
      // 공식 문서 엔드포인트: https://maps.apigw.ntruss.com/map-geocode/v2/geocode
      '/api/naver-geocode': {
        target: 'https://maps.apigw.ntruss.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/naver-geocode/, '/map-geocode/v2/geocode'),
        headers: {
          'x-ncp-apigw-api-key-id': '8ek0m4smqn',
          'x-ncp-apigw-api-key': 'VAQUDiyCgwXJnRJFgvLKqX6k6ABrlPNrtqojdRJo',
          'Accept': 'application/json',
        },
      },
    },
  },
});
