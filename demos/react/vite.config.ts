import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'freetext-search/react': resolve(__dirname, '../../src/react/index.ts'),
      'freetext-search': resolve(__dirname, '../../src/index.ts'),
    },
  },
})
