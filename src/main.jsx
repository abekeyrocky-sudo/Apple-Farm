import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// টেলিগ্রাম ওয়েবঅ্যাপ আর্লি কনফিগারেশন ও ক্লোজিং কনফার্মেশন ওয়ার্নিং
if (typeof window !== 'undefined') {
  if (window.Telegram?.WebApp) {
    try {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();
      tg.disableVerticalSwipes?.();
    } catch (err) {
      console.warn('Telegram early init error:', err);
    }
  }

  // ব্রাউজার / ডেস্কটপে ক্লোজ করার ওয়ার্নিং
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to exit Apple Farm?';
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

