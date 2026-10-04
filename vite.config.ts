import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relatieve paden, zodat de site werkt op GitHub Pages (https://<naam>.github.io/gotcha/).
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
});
