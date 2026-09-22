import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import homeBgImg from '../../assets/home-page-background.png';

export default function MinePage({ 
  user = { apples: 1250, diamonds: 549.0, level: 3, name: 'Rocky' }, 
  onHarvest, 
  onWithdraw, 
  onNavigate,
  onOpenProfile
}) {
  const [floatingPills, setFloatingPills] = useState([]);
  const [energy, setEnergy] = useState(85);
  const maxEnergy = 100;

  // গাছ বা আপেলে ট্যাপ করার হ্যান্ডলার
  const handleTap = (e) => {
    if (energy <= 0) return;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    if (onHarvest) onHarvest();
    setEnergy((prev) => Math.max(0, prev - 1));

    // ক্লিক করার স্থানাঙ্ক
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : 140 + Math.random() * 40;
    const y = e.clientY ? e.clientY - rect.top : 200 + Math.random() * 60;
    const id = Date.now() + Math.random();

    setFloatingPills((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloatingPills((prev) => prev.filter((p) => p.id !== id));
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
              <div className="w-full h-full bg-[#1b4332] rounded-full flex items-center justify-center text-xl">
                👦🏻
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1a2f4c] leading-tight drop-shadow-sm">{user.name || 'Rocky'}</h2>
              <span className="text-xs font-bold text-[#32527b]">Lv.{user.level || 3}</span>
            </div>
          </div>

          {/* Diamond Pill */}
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-sky-100">
            <img 
              src={diamondImg} 
              alt="Diamond"
              className="w-5 h-5 object-contain filter drop-shadow"
            />
            <span className="text-sm font-black text-[#1c355e]">{Number(user.diamonds || 0).toFixed(1)}</span>
          </div>
        </div>

        {/* Apple Balance Card */}
        <div className="bg-[#FFF8DF] border-2 border-[#FFE8A3] rounded-3xl p-3 px-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={appleImg} 
              alt="Apple" 
              className="w-11 h-11 object-contain filter drop-shadow-md transform -rotate-6"
            />
            <div>
              <p className="text-[11px] font-bold text-[#5c4a32] tracking-wide">Apple Balance</p>
              <h1 className="text-2xl font-black text-[#12284c] tracking-tight">{(user.apples || 0).toLocaleString()}</h1>
            </div>
          </div>

          <button 
            onClick={onWithdraw || (() => onNavigate?.('withdraw'))}
            className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all">
            Withdraw
          </button>
        </div>

      </div>

      {/* ----------------- CENTER MINE / CLICK TO COLLECT SCENE OVER BACKGROUND ----------------- */}
      <div 
        onClick={handleTap}
        className="relative flex-1 flex flex-col items-center justify-center cursor-pointer active:brightness-105 transition-all overflow-hidden"
      >
        {/* Popping Floating +1 Apple Pills */}
        {floatingPills.map((badge) => (
          <div
            key={badge.id}
            style={{ left: `${badge.x}px`, top: `${badge.y}px` }}
            className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0094FF] text-white text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-lg animate-bounce"
          >
            <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
            <span>+1 APPLE</span>
          </div>
        ))}

        {/* Pointer Animation Tapping Center */}
        <div className="pointer-events-none flex flex-col items-center gap-2 transform animate-bounce">
          <span className="text-4xl filter drop-shadow-lg">👆🏻</span>
          <div className="flex items-center gap-1.5 bg-[#0094FF] text-white text-xs font-black px-3.5 py-1 rounded-full border-2 border-white shadow-md animate-pulse">
            <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
            <span>TAP TO HARVEST</span>
          </div>
        </div>
      </div>

      {/* ----------------- KEEP TAPPING ENERGY BAR ----------------- */}
      <div className="px-4 py-2 z-20 bg-white/40 backdrop-blur-sm border-t border-white/50">
        <div className="w-full bg-white/95 rounded-2xl p-2 px-3 border border-sky-100 shadow-sm flex items-center gap-3">
          <img src={appleImg} alt="Apple" className="w-7 h-7 object-contain" />
          
          <div className="flex-1">
            <div className="flex justify-between items-center text-[11px] font-black text-[#192f52] mb-1">
              <span>Keep Tapping...</span>
              <span className="text-emerald-700">{energy} / {maxEnergy}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#e4edf5] rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-2.5 flex justify-between items-center z-30 border-t border-gray-100">
        
        {/* Home */}
        <button 
          onClick={() => onNavigate?.('home')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] font-bold">Home</span>
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
