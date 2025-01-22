import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 開發、產品
  base: process.env.NODE_ENV === "production" ? "/React-week3/" : "/",
  plugins: [react()],
})
