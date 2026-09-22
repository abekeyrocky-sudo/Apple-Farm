import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';

export default function ProfilePage({ 
  user = { name: 'Rocky', id: 40281, level: 3 }, 
  onBack, 
  onNavigate,
  onLogout,
  onRedeemBonus
}) {
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // মেনু আইটেমের তালিকা
  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: 'redeem',
      label: 'Redeem Code',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M20 12v10H4V12" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
    },
    {
      id: 'support',
      label: 'Help & Support',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About Us',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
        </svg>
      ),
    },
  ];

  // মেনু ক্লিক অ্যাকশন
  const handleItemClick = (id) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    if (id === 'redeem') {
      setShowRedeemModal(true);
    } else if (id === 'transactions') {
      onNavigate?.('wallet');
    }
  };

  const handleRedeemSubmit = (e) => {
    e.preventDefault();
    if (!redeemInput) return;
    setRedeemSuccess(true);
    if (onRedeemBonus) {
      onRedeemBonus(500);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => {
      setRedeemSuccess(false);
      setShowRedeemModal(false);
      setRedeemInput('');
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div>
        {/* Back Button */}
        <div className="pt-2 mb-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Info Section */}
        <div className="flex items-center gap-4 px-2 mb-5">
          {/* Avatar Container */}
          <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-[0_4px_14px_rgba(0,140,255,0.15)] bg-gradient-to-tr from-[#38bdf8] to-[#bae6fd] flex items-center justify-center overflow-hidden">
            <span className="text-4xl filter drop-shadow">👦🏻</span>
          </div>

          {/* User Details */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#192f52] tracking-tight">
              {user.name || 'Rocky'}
            </h1>
            <p className="text-xs font-bold text-[#567396]">
              ID: {user.id || 40281}
            </p>
            <div>
              <span className="inline-block bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-sm">
                Lv.{user.level || 3}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- SETTINGS MENU CARD ----------------- */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.05)] overflow-hidden divide-y divide-slate-100">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="flex items-center justify-between p-3.5 px-4 cursor-pointer hover:bg-slate-50/80 active:bg-slate-100 transition-colors"
            >
              {/* Left: Icon & Label */}
              <div className="flex items-center gap-3.5 text-[#192f52]">
                <div className="w-6 h-6 flex items-center justify-center text-[#2b4c7e]">
                  {item.icon}
                </div>
                <span className="text-sm font-extrabold tracking-tight">
                  {item.label}
                </span>
              </div>

              {/* Right: Chevron Arrow */}
              <div className="text-[#192f52]">
                <svg className="w-4 h-4 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ----------------- LOG OUT BUTTON ----------------- */}
      <div className="pb-5 pt-4">
        <button 
          onClick={onLogout || onBack}
          className="w-full py-3 rounded-2xl bg-[#fee2e2]/70 hover:bg-[#fee2e2] border border-red-200/80 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {/* Power/Logout Icon */}
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
            <svg className="w-3 h-3 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </div>
          <span className="text-sm font-black text-red-500">Log Out</span>
        </button>
      </div>

      {/* ----------------- REDEEM CODE MODAL ----------------- */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-[#192f52] text-base">Redeem Promo Code</h3>
              <button onClick={() => setShowRedeemModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {redeemSuccess ? (
              <div className="py-4 text-center text-emerald-600 font-black text-sm flex flex-col items-center gap-1">
                <span className="text-2xl">🎉</span>
                <span>Code Redeemed! +500 Apples</span>
              </div>
            ) : (
              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Enter your code (e.g. APPLE2026)"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-farm-light-green uppercase tracking-wider"
                />
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all">
                  Claim 500 Apples
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
