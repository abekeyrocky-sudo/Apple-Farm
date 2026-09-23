import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';

export default function WalletPage({ 
  user = { apples: 0, diamonds: 0.0 }, 
  onBack, 
  onNavigate 
}) {
  const [selectedCurrency, setSelectedCurrency] = useState('Apple');

  // রেফারেন্স ইমেজের হুবহু ট্রানজ্যাকশন ডাটা
  const transactions = [
    {
      id: 1,
      title: 'Task Reward',
      amount: '+50 Apples',
      type: 'apple',
      icon: <img src={appleImg} alt="Apple" className="w-6 h-6 object-contain" />,
      iconBg: 'bg-red-50 border-red-100',
    },
    {
      id: 2,
      title: 'Watch Ad',
      amount: '+10 Apples',
      type: 'diamond',
      icon: <img src={diamondImg} alt="Diamond" className="w-6 h-6 object-contain" />,
      iconBg: 'bg-sky-50 border-sky-100',
    },
    {
      id: 3,
      title: 'Invite Bonus',
      amount: '+100 Apples',
      type: 'apple',
      icon: <img src={appleImg} alt="Apple" className="w-6 h-6 object-contain" />,
      iconBg: 'bg-red-50 border-red-100',
    },
  ];

  // ফিল্টার হ্যান্ডলার ও হ্যাপটিক্স
  const handleTabChange = (type) => {
    setSelectedCurrency(type);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mb-3 mt-1">
          {/* Back Button */}
          <button 
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Wallet
          </h1>

          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* 1. TOTAL BALANCE CARD */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 px-5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.05)] mb-3">
          <span className="text-xs font-bold text-[#6782a2]">Total Balance</span>
          
          <div className="flex items-center justify-between mt-1">
            {/* Apple Total */}
            <div className="flex items-center gap-2">
              <img src={appleImg} alt="Apple" className="w-8 h-8 object-contain filter drop-shadow" />
              <span className="text-2xl font-black text-[#192f52] tracking-tight">
                {(user.apples || 0).toLocaleString()}
              </span>
            </div>

            {/* Diamond Total */}
            <div className="flex items-center gap-2">
              <img src={diamondImg} alt="Diamond" className="w-7 h-7 object-contain filter drop-shadow" />
              <span className="text-xl font-black text-[#192f52]">
                {Number(user.diamonds || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. CURRENCY TOGGLE TABS (Apple / Diamond) */}
        <div className="flex items-center bg-[#e4eff8] p-1 rounded-full mb-3.5">
          <button
            onClick={() => handleTabChange('Apple')}
            className={`flex-1 py-2 rounded-full font-black text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 ${
              selectedCurrency === 'Apple'
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white shadow-md'
                : 'text-[#506e8c] hover:text-[#192f52]'
            }`}
          >
            <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
            Apple
          </button>
          
          <button
            onClick={() => handleTabChange('Diamond')}
            className={`flex-1 py-2 rounded-full font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
              selectedCurrency === 'Diamond'
                ? 'bg-gradient-to-r from-[#00A3FF] to-[#0077cc] text-white shadow-md'
                : 'text-[#506e8c] hover:text-[#192f52]'
            }`}
          >
            <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
            Diamond
          </button>
        </div>

        {/* 3. INDIVIDUAL BALANCE CARDS */}
        <div className="space-y-2 mb-4">
          
          {/* Apple Row */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={appleImg} alt="Apple" className="w-7 h-7 object-contain filter drop-shadow-sm" />
              <span className="text-sm font-extrabold text-[#192f52]">Apple</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
              <span className="text-base font-black text-[#192f52]">{(user.apples || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Diamond Row */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={diamondImg} alt="Diamond" className="w-7 h-7 object-contain filter drop-shadow-sm" />
              <span className="text-sm font-extrabold text-[#192f52]">Diamond</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
              <span className="text-base font-black text-[#192f52]">{Number(user.diamonds || 0).toFixed(1)}</span>
            </div>
          </div>

        </div>

        {/* 4. STAKING CENTER BANNER */}
        <div 
          onClick={() => onNavigate?.('staking')}
          className="bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1e824c] rounded-2xl p-3 px-4 shadow-md text-white flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all mb-4 border border-emerald-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sprout className="w-6 h-6 stroke-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black leading-tight">Staking Center</h3>
                <span className="text-[10px] font-black bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded-md">
                  Up to 25% APY
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Stake $APPLE & items to earn daily passive yields</p>
            </div>
          </div>
          <svg className="w-5 h-5 stroke-white stroke-[2.5] fill-none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* 5. RECENT TRANSACTIONS TITLE */}
        <h2 className="text-base font-black text-[#192f52] tracking-tight mb-2">
          Recent Transactions
        </h2>
      </div>

      {/* ----------------- TRANSACTIONS LIST ----------------- */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-420px)]">
        {transactions.map((tx) => (
          <div 
            key={tx.id}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
          >
            {/* Left: Icon & Details */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border ${tx.iconBg} flex items-center justify-center text-xl`}>
                {tx.icon}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#192f52] leading-tight">
                  {tx.title}
                </h3>
                <p className="text-xs font-bold text-[#567396]">
                  {tx.amount}
                </p>
              </div>
            </div>

            {/* Right: Green Accent Arrow */}
            <div className="text-emerald-500">
              <svg className="w-5 h-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="wallet" onNavigate={onNavigate} />

    </div>
  );
}
