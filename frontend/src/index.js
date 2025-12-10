// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Service worker registration with auto-reload
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        console.log('SW registered:', reg.scope);

        let refreshing = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          // New SW took control → reload once
          window.location.reload();
        });
      })
      .catch(err => {
        console.error('SW registration failed', err);
      });
  });
}

reportWebVitals();
