
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { securityGuardPlugin } from "./vite-plugin-security-guard";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    securityGuardPlugin({ disabled: mode === 'development' }),
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
    // Conservative inlining - allow small assets for performance
    assetsInlineLimit: 4096, // Allow small assets (4KB) to be inlined
    
    // Optimized chunk splitting for better caching and loading reliability
    rollupOptions: {
      output: {
        // CRITICAL: Prevent inline dynamic imports (prevents data: URLs)
        inlineDynamicImports: false,
        
        // CRITICAL: Ensure .js extension for all entry files to prevent .tsx in production
        entryFileNames: '[name]-[hash].js',
        
        manualChunks: {
          // CRITICAL: React must be first chunk to load synchronously
          '0-react-core': ['react', 'react-dom', 'react/jsx-runtime'],
          'vendor-react-router': ['react-router-dom'],
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
          'vendor-cloudinary': [
            'browser-image-compression',
            '@/components/ui/cloudinary-video-upload',
            '@/components/ui/CloudinaryUploadProgress', 
            '@/hooks/useCloudinaryUpload',
            '@/hooks/useCloudinaryVideoUpload',
            '@/hooks/useStagedCloudinaryUpload',
            '@/hooks/useOptimizedCloudinaryUpload',
            '@/utils/cloudinaryUpload',
            '@/utils/cloudinaryUtils',
            '@/utils/directCloudinaryUpload',
            '@/utils/secureCloudinary'
          ],
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
      // Improved error recovery for module loading failures
      onError: (error: any, defaultHandler: any) => {
        if (error.code === 'CHUNK_LOAD_ERROR') {
          console.warn('🚨 Chunk load error detected (possibly network blocking):', error);
          console.info('💡 This may be due to inline module blocking on mobile networks');
          return;
        }
        if (error.code === 'MODULE_NOT_FOUND') {
          console.error('📦 Module loading failed:', error);
          return;
        }
        console.error('🔥 Build error:', error);
        defaultHandler(error);
      }
    },
    // Reduced chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Source maps only for development
    sourcemap: mode === 'development',
    // Minification with terser for better compression
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        unsafe_arrows: true,
        passes: 2
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      }
    } : undefined,
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
