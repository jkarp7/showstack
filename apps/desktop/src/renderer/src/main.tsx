import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './services/sentry';
import App from './App';
import './index.css';

// Initialize Sentry before React renders (no-op if VITE_SENTRY_DSN not set)
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
