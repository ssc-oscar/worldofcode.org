import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes } from '@generouted/react-router';
import AppProvider from '@/providers';

// Need to reset the styles. Thanks: https://github.com/hyoban/unocss-preset-shadcn/issues/17
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <React.StrictMode>
      <Routes />
    </React.StrictMode>
  </AppProvider>
);
