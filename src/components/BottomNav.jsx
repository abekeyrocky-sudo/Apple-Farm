import React from 'react';

export default function BottomNav({ currentTab, onNavigate }) {
  const triggerHaptic = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'fill-[#2ecc71]' : 'stroke-current stroke-2 fill-none'}`} viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={active ? '#2ecc71' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'task',
      label: 'Task',
      icon: (active) => (
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'airdrop',
      label: 'Airdrop',
      icon: (active) => (
        <div className="relative">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            {/* Parachute / Airdrop Box Icon */}
            <path d="M12 2a8 8 0 0 0-8 8c0 3 4 5 8 5s8-2 8-5a8 8 0 0 0-8-8z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 10l5 7m6 0l5-7m-8 7v-5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="9.5" y="17" width="5" height="4.5" rx="1.5" fill={active ? '#2ecc71' : 'none'} stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          {/* Subtle sparkle indicator badge */}
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
        </div>
      )
    },
    {
      id: 'game',
      label: 'Game',
      icon: (active) => (
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12h4m-2-2v4m8-2h.01m3-2h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: (active) => (
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5 flex justify-around items-center z-30 border-t border-gray-100">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              triggerHaptic();
              onNavigate?.(item.id);
            }}
            className={`flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-90 ${
              isActive 
                ? 'text-[#2ecc71] font-black' 
                : 'text-gray-400 hover:text-gray-600 font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 scale-110' : ''}`}>
              {item.icon(isActive)}
            </div>
            <span className={`text-[11px] tracking-tight ${isActive ? 'font-black text-[#2ecc71]' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
