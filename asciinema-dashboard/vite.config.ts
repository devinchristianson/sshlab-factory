import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer],
    },
  },
  build: {
    outDir: "./dist/backend/public"
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend'),
      '@components': path.resolve(__dirname, './src/frontend/components'),
      '@pages': path.resolve(__dirname, './src/frontend/pages')
    }
  },
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }
})