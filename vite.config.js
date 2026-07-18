import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to your GitHub Pages repo name, e.g. '/bl-production-tycoon/'
// Update this if deploying to a custom domain (use '/')
export default defineConfig({
  plugins: [react()],
  base: '/blprodtycoon/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: 'all',
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: 'all',
  },
})
