import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    // Отключаем кеширование в development
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    // В production Vite автоматически добавляет хеши к именам файлов
    // Это гарантирует, что при обновлении пользователи получат новую версию
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Явно указываем формат имен файлов с хешами (это по умолчанию)
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Очищаем папку dist перед каждой сборкой
    emptyOutDir: true,
    // Минификация для production
    minify: 'terser',
    // Генерируем source maps для отладки (можно отключить в production)
    sourcemap: false,
  },
})

