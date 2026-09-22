import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import homeBgImg from '../../assets/home-page-background.png';

export default function HomePage({ onNavigate, onWithdraw, onOpenProfile }) {
  const [appleCount, setAppleCount] = useState(1250);
  const [diamondCount] = useState(549.0);
  const [floatingBadges, setFloatingBadges] = useState([]);

  // স্ক্রিনে/গাছে ট্যাপ করলে +1 APPLE ব্যাজ অ্যানিমেশন
  const handleTreeTap = (e) => {
    // Telegram Mini App Haptic Feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    setAppleCount((prev) => prev + 1);

    // ক্লিক করার স্থানাঙ্ক নেওয়া
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left || 140 + Math.random() * 40;
    const y = e.clientY - rect.top || 200 + Math.random() * 60;
    const id = Date.now() + Math.random();

    setFloatingBadges((prev) => [...prev, { id, x, y }]);

    setTimeout(() => {
      setFloatingBadges((prev) => prev.filter((b) => b.id !== id));
    }, 900);
  };

  return (
    <div 
      style={{ backgroundImage: `url(${homeBgImg})` }}
      className="relative w-full max-w-md mx-auto min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="pt-3 px-4 pb-2 z-20">
        
        {/* User Info & Diamond Counter */}
        <div className="flex items-center justify-between mb-3">
          {/* User Profile */}
          <div 
            onClick={onOpenProfile || (() => onNavigate?.('profile'))}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-gradient-to-tr from-amber-300 to-sky-300 p-0.5 flex items-center justify-center overflow-hidden">
              {/* Avatar Icon */}
              <div className="w-full h-full bg-[#1b4332] rounded-full flex items-center justify-center text-xl">
                👦🏻
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1a2f4c] leading-tight drop-shadow-sm">Rocky</h2>
              <span className="text-xs font-bold text-[#32527b]">Lv.3</span>
            </div>
          </div>

          {/* Diamond Pill */}
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-sky-100">
            <img 
              src={diamondImg} 
              alt="Diamond"
              className="w-5 h-5 object-contain filter drop-shadow"
            />
            <span className="text-sm font-black text-[#1c355e]">{diamondCount.toFixed(1)}</span>
          </div>
        </div>

        {/* Apple Balance Card */}
        <div className="bg-[#FFF8DF] border-2 border-[#FFE8A3] rounded-3xl p-3 px-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3D Glossy Apple Image */}
            <img 
              src={appleImg} 
              alt="Apple" 
              className="w-11 h-11 object-contain filter drop-shadow-md transform -rotate-6"
            />
            <div>
              <p className="text-[11px] font-bold text-[#5c4a32] tracking-wide">Apple Balance</p>
              <h1 className="text-2xl font-black text-[#12284c] tracking-tight">{appleCount.toLocaleString()}</h1>
            </div>
          </div>

          <button 
            onClick={onWithdraw}
            className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all">
            Withdraw
          </button>
        </div>

        {/* 3 Action Buttons (Daily Task, Watch Ads, Invite Friends) */}
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          
          {/* Daily Task */}
          <button 
            onClick={() => onNavigate?.('task')}
            className="bg-white/95 backdrop-blur-md border border-amber-100 p-2.5 rounded-2xl shadow-sm flex flex-col items-center justify-center active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex items-center justify-center text-white mb-1.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="text-xs font-black text-[#1c324f]">Daily Task</span>
            <span className="text-[10px] font-bold text-gray-400">Get Rewards</span>
          </button>

          {/* Watch Ads */}
          <button 
            onClick={() => onNavigate?.('ads')}
            className="bg-white/95 backdrop-blur-md border border-indigo-100 p-2.5 rounded-2xl shadow-sm flex flex-col items-center justify-center active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md flex items-center justify-center text-white mb-1.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm6 2.5v7l6-3.5-6-3.5z"/>
              </svg>
            </div>
            <span className="text-xs font-black text-[#1c324f]">Watch Ads</span>
            <span className="text-[10px] font-bold text-gray-400">+50 Apples</span>
          </button>

          {/* Invite Friends */}
          <button 
            onClick={() => onNavigate?.('invite')}
            className="bg-white/95 backdrop-blur-md border border-purple-100 p-2.5 rounded-2xl shadow-sm flex flex-col items-center justify-center active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md flex items-center justify-center text-white mb-1.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <span className="text-xs font-black text-[#1c324f]">Invite</span>
            <span className="text-[10px] font-bold text-gray-400">10%</span>
          </button>
        </div>

      </div>

      {/* ----------------- CENTER INTERACTIVE TAP AREA OVER BACKGROUND ----------------- */}
      <div 
        onClick={handleTreeTap}
        className="relative flex-1 flex flex-col items-center justify-center cursor-pointer active:brightness-105 transition-all overflow-hidden"
      >
        {/* Floating +1 Apple Badges upon tap */}
        {floatingBadges.map((badge) => (
          <div
            key={badge.id}
            style={{ left: badge.x, top: badge.y }}
            className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0094FF] text-white text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-lg animate-bounce"
          >
            <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
            <span>+1 APPLE</span>
          </div>
        ))}

        {/* Ambient Click Prompt / Guide */}
        <div className="absolute top-[45%] pointer-events-none flex items-center gap-1.5 bg-[#0094FF] text-white text-xs font-black px-3.5 py-1 rounded-full border-2 border-white shadow-md animate-pulse">
          <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
          <span>+1 APPLE</span>
        </div>
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-2.5 flex justify-between items-center z-30 border-t border-gray-100">
        
        {/* Home (Active) */}
        <button 
          onClick={() => onNavigate?.('home')} 
          className="flex flex-col items-center gap-0.5 text-[#2ecc71] transition-transform active:scale-90">
          <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] font-black">Home</span>
        </button>

        {/* Task */}
        <button 
          onClick={() => onNavigate?.('task')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[11px] font-bold">Task</span>
        </button>

        {/* Game */}
        <button 
          onClick={() => onNavigate?.('game')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m8-2h.01m3-2h.01" />
          </svg>
          <span className="text-[11px] font-bold">Game</span>
        </button>

        {/* Wallet */}
        <button 
          onClick={() => onNavigate?.('wallet')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-bold">Wallet</span>
        </button>

      </div>

    </div>
  );
}
