import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes } from '@generouted/react-router';
import AppProvider from './providers';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <React.StrictMode>
      <Routes />
    </React.StrictMode>
  </AppProvider>
);
