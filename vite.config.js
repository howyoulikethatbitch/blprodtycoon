import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a relative base so assets are loaded correctly when packaged for Capacitor/Android
export default defineConfig({
  plugins: [react()],
  base: './',
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
