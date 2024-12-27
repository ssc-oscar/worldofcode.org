import path from 'path';
import react from '@vitejs/plugin-react';
import generouted from '@generouted/react-router/plugin';
import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import mdx from '@mdx-js/rollup';
import mdPlugin from 'vite-plugin-markdown';

export default defineConfig({
  plugins: [{ enforce: 'pre', ...mdx() }, UnoCSS(), react(), generouted()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
