import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5177, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom'], patterns: ['./src/data/generated.ts'] },
      },
    },
  },
});
