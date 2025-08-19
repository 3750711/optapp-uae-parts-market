
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
      // CRITICAL: Force single React instance - исправляем дублирование
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
    },
    // CRITICAL: Prevent React duplicates at resolve level
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // Optimized chunk splitting for better caching and loading reliability
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
        // Optimized chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith('vendor-')) {
            return `assets/vendor/[name]-[hash].js`;
          }
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
      // Improved error recovery
      onError: (error: any, defaultHandler: any) => {
        if (error.code === 'CHUNK_LOAD_ERROR') {
          console.warn('Chunk load error detected, this will be handled by error boundaries');
          return;
        }
        defaultHandler(error);
      }
    },
    // Reduced chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Source maps only for development
    sourcemap: mode === 'development',
    // Minification only for production
    minify: mode === 'production' ? 'esbuild' : false,
    // CSS code splitting
    cssCodeSplit: true,
    // Remove console.log in production
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : undefined,
    // Target modern browsers for better chunk loading
    target: 'es2020'
  },
  // Optimized dependency pre-bundling
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
    exclude: ['lodash'],
    // Force optimization in development for stability
    force: mode === 'development'
  },
  // Enhanced dev server settings
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
