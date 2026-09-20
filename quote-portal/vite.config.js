import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Set VITE_BASE=/repo-name/ when deploying under a sub-path (e.g. GitHub Pages).
    base: env.VITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    // 8787 matches the localhost origin already allow-listed on the n8n webhooks.
    server: { port: 8787, strictPort: true },
    preview: { port: 8787, strictPort: true },
    build: {
      target: 'es2022',
      // three.js is intentionally one chunk; it is cached across visits.
      chunkSizeWarningLimit: 1200,
    },
  }
})
