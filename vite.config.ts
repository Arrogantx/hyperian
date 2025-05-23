import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' http://localhost:5174 ws://localhost:5174 wss://localhost:5174 http: https: ws: wss: https://rpc.hyperliquid.xyz https://*.supabase.co https://*.supabase.net;",
    },
    proxy: {
      '/api/rpc-proxy': {
        target: 'https://rpc.hyperliquid.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rpc-proxy/, '/evm'),
        secure: false,
      },
    },
  },
});
