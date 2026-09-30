import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { onesignalPlugin } from './server/onesignal-plugin.js'

export default defineConfig({
  plugins: [react(), onesignalPlugin()],
  base: '/',
  server: {
    allowedHosts: ['.monkeycode-ai.live'],
  },
})