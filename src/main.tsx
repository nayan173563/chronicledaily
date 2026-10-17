import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety shield: Prevent external ad network cross-origin scripts or ad blockers from throwing uncaught top-level errors
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  const file = event.filename || '';
  if (
    !msg ||
    msg === 'Script error.' ||
    /profitableratecpmnetwork|highrevenueformat|effectivegatecontent/.test(file) ||
    /document\.write|Failed to execute 'write'/.test(msg)
  ) {
    event.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    !reason ||
    reason === 'Script error.' ||
    /profitableratecpmnetwork|highrevenueformat|effectivegatecontent/.test(reason) ||
    /document\.write|Failed to execute 'write'/.test(reason)
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
