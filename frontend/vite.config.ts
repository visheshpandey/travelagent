import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allows the dev server to be reached through a tunnel (ngrok/cloudflared),
    // which arrives with a Host header Vite wouldn't otherwise recognize.
    allowedHosts: true,
  },
})
