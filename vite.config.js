import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/testcicd/',
  test: {
    // 用 jsdom 模拟浏览器环境，这样测试里才有 document / window
    environment: 'jsdom',
    // 每个测试文件跑之前先执行它，用来挂载 jest-dom 的断言
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
