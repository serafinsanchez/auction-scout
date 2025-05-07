import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Make sure this is included
import App from './App';

// Use createRoot API for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Disable hot module replacement to avoid react-refresh issues
if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // No-op
  });
}
