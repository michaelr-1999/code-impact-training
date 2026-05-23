import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['code-impact-trainingfrontend-development.up.railway.app'],
    proxy: {
      '/api': 'https://code-impact-trainingbackend-development.up.railway.app',
    },
  },
})
