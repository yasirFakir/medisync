import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@medisync/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@medisync/shared-types': path.resolve(__dirname, '../../../../packages/shared-types/src'),
    },
  },
  server: { port: 3103 },
})
