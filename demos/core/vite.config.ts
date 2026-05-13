import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'freetext-search': resolve(__dirname, '../../src/index.ts'),
    },
  },
})
