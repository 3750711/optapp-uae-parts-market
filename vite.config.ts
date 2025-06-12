
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
          // Основные vendor чанки
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch'
          ],
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['lodash', 'date-fns', 'clsx', 'class-variance-authority'],
          'vendor-icons': ['lucide-react'],
          
          // Критические страницы (не lazy) - группируем отдельно
          'critical-pages': [
            'src/pages/Index.tsx',
            'src/pages/Login.tsx',
            'src/pages/Register.tsx',
            'src/pages/Catalog.tsx'
          ],
          
          // Админ чанки - разделяем для лучшей производительности
          'admin-core': [
            'src/pages/AdminDashboard.tsx',
            'src/components/admin/AdminLayout.tsx'
          ],
          'admin-users': [
            'src/pages/AdminUsers.tsx',
            'src/hooks/useAdminUsersState.ts',
            'src/hooks/useAdminUsersActions.ts'
          ],
          'admin-products': [
            'src/pages/AdminProducts.tsx',
            'src/hooks/useAdminProductsActions.ts'
          ],
          'admin-orders': [
            'src/pages/AdminOrders.tsx',
            'src/hooks/useOptimizedOrdersQuery.ts',
            'src/hooks/useOrderActions.ts'
          ],
          
          // Продавец чанки
          'seller-core': [
            'src/pages/SellerDashboard.tsx',
            'src/pages/SellerListings.tsx'
          ],
          'seller-products': [
            'src/pages/SellerAddProduct.tsx',
            'src/components/product/OptimizedAddProductForm.tsx'
          ],
          'seller-orders': [
            'src/pages/SellerOrders.tsx',
            'src/pages/SellerOrderDetails.tsx'
          ],
          
          // Общие компоненты
          'shared-components': [
            'src/components/layout/Header.tsx',
            'src/components/layout/Footer.tsx',
            'src/components/auth/ProtectedRoute.tsx'
          ],
          
          // Каталог и продукты
          'catalog-products': [
            'src/pages/ProductDetail.tsx',
            'src/hooks/useOptimizedCatalogProducts.ts'
          ]
        },
        // Оптимизированные имена файлов для кэширования
        chunkFileNames: (chunkInfo) => {
          // Определяем тип чанка для лучшего кэширования
          if (chunkInfo.name.startsWith('vendor-')) {
            return `assets/vendor/[name]-[hash].js`;
          }
          if (chunkInfo.name.startsWith('admin-')) {
            return `assets/admin/[name]-[hash].js`;
          }
          if (chunkInfo.name.startsWith('seller-')) {
            return `assets/seller/[name]-[hash].js`;
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
