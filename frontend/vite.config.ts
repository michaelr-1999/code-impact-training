import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['code-impact-trainingfrontend-development.up.railway.app'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
