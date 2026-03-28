import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import './index.css';

// Apply saved theme before React mounts to avoid flash
const saved = localStorage.getItem('uno-theme') ?? 'dark';
document.documentElement.classList.toggle('dark', saved === 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
