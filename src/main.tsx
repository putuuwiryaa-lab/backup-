import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './ui/design-system.css';
import './ui/theme-polish.css';
import './ui/video-layout-polish.css';
import './ui/motion-polish.css';
import './ui/logo-mark-size.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
