import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Оптимизированное разделение чанков для лучшего кэширования и производительности
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            'lucide-react',
          ],
          'vendor-lodash': ['lodash'],
          'vendor-utils': ['zod', 'react-hook-form', 'date-fns', 'clsx', 'class-variance-authority'],
        },
        // Оптимизированные имена файлов для кэширования
        chunkFileNames: (chunkInfo) => {
          // Определяем тип чанка для лучшего кэширования
          if (chunkInfo.name.startsWith('vendor-')) {
            return `assets/vendor/[name]-[hash].js`;
          }
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          // Группируем статические ресурсы
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Увеличиваем лимит размера чанка с предупреждением
    chunkSizeWarningLimit: 800,
    // Source maps только для development
    sourcemap: mode === 'development',
    // Минификация только для production
    minify: mode === 'production' ? 'esbuild' : false,
    // Оптимизация CSS
    cssCodeSplit: true,
    // Удаляем console.log в production
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : undefined,
  },
  // Оптимизированная предварительная сборка зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
      'clsx',
      'class-variance-authority'
    ],
    // Исключаем большие библиотеки из предварительной сборки
    exclude: ['lodash'],
    // Принудительная оптимизация в development для стабильности
    force: mode === 'development'
  },
  // Настройки для лучшей производительности dev сервера
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
