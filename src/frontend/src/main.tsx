import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ensure the App component is correctly imported
import '@nlux/themes/nova.css'; // Import NLUX's default CSS theme

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
