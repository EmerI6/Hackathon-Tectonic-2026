import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { kbcApi } from './server/api.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: read GEMINI_* server-side only. Only VITE_* vars ever reach the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), kbcApi({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || undefined })],
  }
})
