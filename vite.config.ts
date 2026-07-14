import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 950,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
