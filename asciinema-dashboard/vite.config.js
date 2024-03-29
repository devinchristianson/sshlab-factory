import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    outDir: "./dist/backend/public"
  },
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './src/frontend')
    }
  },
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }
})