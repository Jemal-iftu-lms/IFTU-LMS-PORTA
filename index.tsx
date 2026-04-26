
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Catch and ignore benign Vite WebSocket connection errors
if ((import.meta as any).env.DEV) {
  const isViteError = (err: any) => {
    if (!err) return false;
    const msg = (err.message || err || '').toString();
    const stack = (err.stack || '').toString();
    return msg.includes('WebSocket') || 
           msg.includes('closed without opened') || 
           msg.includes('vite') ||
           stack.includes('vite');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteError(event.error) || isViteError(event.message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service worker disabled to prevent interference with Firestore real-time streams in iframe environments
/*
if ('serviceWorker' in navigator && !((import.meta as any).env.DEV)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('Sovereign SW registered: ', registration.scope);
      })
      .catch(registrationError => {
        console.warn('Sovereign SW skipped or failed: ', registrationError.message);
      });
  });
}
*/

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
