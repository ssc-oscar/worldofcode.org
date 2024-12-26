import path from 'path';
import react from '@vitejs/plugin-react';
import generouted from '@generouted/react-router/plugin';
import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [UnoCSS(), react(), generouted()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
