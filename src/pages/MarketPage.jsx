import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';

export default function MarketPage({ 
  user = { apples: 0, diamonds: 0.0 }, 
  onBack, 
  onNavigate,
  onUpdateUserBalance 
}) {
  const [activeTab, setActiveTab] = useState('Items');
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // রেফারেন্স ইমেজের হুবহু প্রোডাক্ট ডাটা
  const marketItems = [
    // ----------------- ITEMS -----------------
    {
      id: 1,
      name: 'Golden Fertilizer Sack',
      category: 'Items',
      price: 1250,
      currency: 'apple',
      description: 'Increases tree harvest speed by 2x for 24 hours.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Sack illustration */}
          <div className="w-14 h-14 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] rounded-2xl border-2 border-amber-600 shadow-md flex flex-col items-center justify-center relative transform -rotate-1">
            <div className="absolute -top-1.5 w-6 h-3 bg-[#d97706] rounded-full border border-amber-700" />
            <span className="text-xl">🍃</span>
            <div className="w-8 h-1 bg-amber-800/30 rounded-full mt-0.5" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      name: '1h Harvest Boost',
      category: 'Items',
      price: 1250,
      currency: 'apple',
      description: 'Doubles all apple rewards from tapping for 1 hour.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Glowing Potion Bottle */}
          <div className="w-13 h-14 rounded-full bg-gradient-to-b from-emerald-200 to-green-500 border-2 border-emerald-700 shadow-[0_0_12px_rgba(74,222,128,0.5)] flex flex-col items-center justify-center relative">
            <div className="absolute -top-2 w-4 h-3 bg-[#b45309] rounded-t-sm border border-amber-900" />
            <span className="text-lg animate-pulse">✨</span>
            <div className="absolute bottom-2 w-7 h-4 bg-emerald-400/80 rounded-full blur-[1px]" />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      name: "Rocky's New Hat",
      category: 'Items',
      price: 549.0,
      currency: 'diamond',
      description: 'Exclusive farmer straw hat. Grants +20% harvest bonus!',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Straw Hat */}
          <div className="w-15 h-11 bg-gradient-to-b from-[#fde68a] to-[#d97706] rounded-full border-2 border-amber-800 shadow-md flex items-center justify-center relative">
            <div className="absolute -top-2 w-8 h-6 bg-[#f59e0b] rounded-t-full border-t border-amber-900" />
            <div className="absolute top-2 w-10 h-1.5 bg-red-500 rounded-full" />
            <span className="text-xs absolute -top-0.5 right-3">🍎</span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      name: '1h Harvest Stand',
      category: 'Items',
      price: 550,
      currency: 'apple',
      description: 'Special apple display stand with automated harvest power.',
      icon: (
        <div className="relative w-16 h-16 flex flex-col items-center justify-center">
          {/* Apple on Wood Stand */}
          <img src={appleImg} alt="Apple" className="w-9 h-9 object-contain filter drop-shadow z-10 -mb-1.5" />
          <div className="w-12 h-4 bg-[#854d0e] rounded-full border border-amber-950 shadow-sm" />
        </div>
      ),
    },
    {
      id: 5,
      name: 'Mystery Gift Box',
      category: 'Items',
      price: 1350,
      currency: 'diamond',
      description: 'Contains guaranteed rare boosters and jackpot tokens!',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Gift Box */}
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-xl border-2 border-amber-600 shadow-md flex items-center justify-center relative">
            <div className="absolute inset-y-0 w-2.5 bg-red-500" />
            <div className="absolute inset-x-0 h-2.5 bg-red-500" />
            <div className="absolute -top-2 text-red-600 font-black text-xs">🎀</div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      name: 'Rare Apple Seed',
      category: 'Items',
      price: 549.0,
      currency: 'diamond',
      description: 'Plant a golden tree with 3x diamond drop chances.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <img src={appleImg} alt="Rare Apple" className="w-12 h-12 object-contain filter drop-shadow-[0_4px_8px_rgba(239,68,68,0.4)] animate-bounce-gentle" />
        </div>
      ),
    },

    // ----------------- BOOSTS -----------------
    {
      id: 7,
      name: 'Energy Surge Potion',
      category: 'Boosts',
      price: 450,
      currency: 'apple',
      description: 'Instantly refills your stamina energy bar to 100%.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          ⚡
        </div>
      ),
    },
    {
      id: 8,
      name: '24h Super Harvester',
      category: 'Boosts',
      price: 2000,
      currency: 'apple',
      description: 'Collects apples automatically every minute for 24 hours.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          🤖
        </div>
      ),
    },
    {
      id: 9,
      name: 'Lucky Wheel Pass (x5)',
      category: 'Boosts',
      price: 350.0,
      currency: 'diamond',
      description: '5 free super spins on the Lucky Wheel with guaranteed wins.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          🎡
        </div>
      ),
    },

    // ----------------- SPECIAL -----------------
    {
      id: 10,
      name: 'Golden Orchard Tree',
      category: 'Special',
      price: 3500.0,
      currency: 'diamond',
      description: 'A permanent mythical tree yielding pure diamond fruits.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          🌟
        </div>
      ),
    },
    {
      id: 11,
      name: 'Master Farmer Title',
      category: 'Special',
      price: 8000,
      currency: 'apple',
      description: 'Exclusive golden profile badge and +50% all earnings.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          👑
        </div>
      ),
    },
    {
      id: 12,
      name: 'Diamond VIP Pass',
      category: 'Special',
      price: 1999.0,
      currency: 'diamond',
      description: 'VIP status with 0% withdrawal fees & instant processing.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
          🎟️
        </div>
      ),
    },
  ];

  // ফিল্টার করা আইটেম
  const filteredItems = marketItems.filter((item) => item.category === activeTab);

  // ক্রয় হ্যান্ডলার
  const handleBuyItem = (item) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (item.currency === 'apple') {
      if ((user.apples || 0) < item.price) {
        setErrorMsg(`Not enough Apples! You need ${item.price.toLocaleString()} 🍎`);
        setTimeout(() => setErrorMsg(null), 2500);
        return;
      }
      if (onUpdateUserBalance) {
        onUpdateUserBalance({ apples: -item.price });
      }
    } else {
      if ((user.diamonds || 0) < item.price) {
        setErrorMsg(`Not enough Diamonds! You need ${item.price.toFixed(1)} 💎`);
        setTimeout(() => setErrorMsg(null), 2500);
        return;
      }
      if (onUpdateUserBalance) {
        onUpdateUserBalance({ diamonds: -item.price });
      }
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setPurchaseSuccess(item);
    setTimeout(() => {
      setPurchaseSuccess(null);
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f3f9ff] to-[#e8f5e9] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="pt-3 px-4 pb-2 z-20">
        <div className="flex items-center justify-between relative mb-3">
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
            Apple Market
          </h1>

          {/* User Small Balance Header Pill */}
          <div className="flex items-center gap-2 bg-white/90 px-2.5 py-1 rounded-full border border-sky-100 shadow-sm text-xs font-black text-[#192f52]">
            <div className="flex items-center gap-1">
              <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
              <span>{(user.apples || 0).toLocaleString()}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
              <span>{Number(user.diamonds || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* ----------------- CATEGORY TABS (Items / Boosts / Special) ----------------- */}
        <div className="flex items-center justify-between gap-2 px-1 mb-2">
          {['Items', 'Boosts', 'Special'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged();
                  }
                }}
                className={`flex-1 py-2 rounded-full font-black text-xs transition-all duration-200 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white shadow-md'
                    : 'bg-white/90 text-[#4c678a] hover:bg-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- TOAST ALERTS ----------------- */}
      {purchaseSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl animate-bounce flex items-center gap-1.5">
          <span>✓ Purchased {purchaseSuccess.name}!</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl animate-shake flex items-center gap-1.5">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* ----------------- MARKET GRID ITEMS (3 COLUMNS) ----------------- */}
      <div className="flex-1 px-3 py-1 overflow-y-auto max-h-[calc(100vh-175px)]">
        <div className="grid grid-cols-3 gap-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-sky-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-between text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Product Icon Frame */}
              <div className="w-full h-18 bg-[#f8fbfe] rounded-xl flex items-center justify-center p-1 border border-slate-100/80 mb-1.5">
                {item.icon}
              </div>

              {/* Product Name */}
              <h3 className="text-[11px] font-black text-[#192f52] leading-tight line-clamp-2 h-7 flex items-center justify-center">
                {item.name}
              </h3>

              {/* Price Row */}
              <div className="flex items-center justify-center gap-1 my-1">
                {item.currency === 'apple' ? (
                  <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                ) : (
                  <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
                )}
                <span className="text-xs font-black text-[#192f52]">
                  {item.currency === 'apple' 
                    ? item.price.toLocaleString() 
                    : item.price.toFixed(1)}
                </span>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handleBuyItem(item)}
                className="w-full py-1.5 rounded-xl font-black text-xs text-white bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 shadow-[0_2px_0_#145a32] border-t border-emerald-300 transition-all mt-0.5"
              >
                Buy
              </button>
            </div>
          ))}
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
