import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/', // Keep as '/' if deployed to domain root
  // If deployed to a subfolder like /unican/, use '/unican/'
})