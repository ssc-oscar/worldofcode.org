import path from 'path';
import react from '@vitejs/plugin-react';
import generouted from '@generouted/react-router/plugin';
import { compression } from 'vite-plugin-compression2';
// import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import UnoCSS from 'unocss/vite';
import zlib from 'zlib';

let env = {
  ...process.env,
  ...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
};

export default defineConfig({
  build: {
    target: ['es2020', 'firefox78', 'chrome79', 'safari13'],
    assetsInlineLimit: 8192,
    sourcemap: process.env.GENERATE_SOURCEMAP !== 'false',
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        compact: true,
        generatedCode: 'es2015',
        manualChunks: {
          react: [
            'react',
            'react/jsx-runtime',
            'react-dom',
            'react-dom/client',
            'react-router-dom'
          ],
          query: ['react-querybuilder'],
          charts: ['@ant-design/charts']
        }
      }
    }
  },
  esbuild: {
    legalComments: 'none'
  },
  plugins: [
    // copy /docs to dist/docs
    // viteStaticCopy({ targets: [{ src: 'public/docs', dest: 'docs' }]}),
    react(),
    UnoCSS(),
    generouted(),
    compression({
      include: /\.*$/,
      exclude: /_redirects|\.(png|jpg|jpeg|webp|mp3|ogg|webm)$/i,
      algorithm: 'brotliCompress',
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]:
            zlib.constants.BROTLI_MAX_QUALITY
        }
      }
    }),
    visualizer({
      open: true, // Open visualization in browser
      gzipSize: true, // Show gzipped sizes
      brotliSize: true, // Show brotli sizes
      filename: 'stats.html' // Output file
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: env.VITE_BASE_URL || 'http://wocapi-preview.osslab-pku.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
