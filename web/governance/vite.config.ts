import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/governance/',
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境：将所有 /api 开头的请求代理到后端
      // 生产环境：前后端同端口 8000，不需要代理
      '^/api|/docs|/openapi.json': {
        target: 'http://127.0.0.1:5670',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../packages/dbgpt-app/src/dbgpt_app/static/governance'),
    emptyOutDir: true,
  },
});
