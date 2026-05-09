import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SearchProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SearchProvider>
    </AuthProvider>
  </React.StrictMode>,
);
