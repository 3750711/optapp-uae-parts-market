
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
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs'
          ],
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['lodash', 'date-fns', 'clsx', 'class-variance-authority'],
          
          // Feature-specific chunks
          'admin-pages': [
            'src/pages/AdminDashboard.tsx',
            'src/pages/AdminUsers.tsx',
            'src/pages/AdminProducts.tsx',
            'src/pages/AdminOrders.tsx',
            'src/pages/AdminStores.tsx'
          ],
          'seller-pages': [
            'src/pages/SellerDashboard.tsx',
            'src/pages/SellerListings.tsx',
            'src/pages/SellerAddProduct.tsx',
            'src/pages/SellerOrders.tsx'
          ],
          'auth-pages': [
            'src/pages/Login.tsx',
            'src/pages/Register.tsx',
            'src/pages/ForgotPassword.tsx',
            'src/pages/ResetPassword.tsx'
          ]
        },
        // Add version hash to chunks for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging in production
    sourcemap: mode === 'development'
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    // Force re-optimization of dependencies when they change
    force: mode === 'development'
  }
}));
