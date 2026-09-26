import React, { useState, useEffect } from 'react';
import { User, Volume2, VolumeX } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import homeBgImg from '../../assets/home-page-background.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import FallingLeaves from '../components/FallingLeaves';
import { calculateLevel } from '../utils/levelSystem';
import { getAvatarSrc } from '../utils/avatars';
import { soundManager } from '../utils/soundManager';

// 🍎 Tree Apples Coordinates & Sizes
const TREE_APPLES = [
  { id: 1, left: '38%', top: '16%', size: 'w-7 h-7' },
  { id: 2, left: '60%', top: '21%', size: 'w-7 h-7' },
  { id: 3, left: '22%', top: '30%', size: 'w-7 h-7' },
  { id: 4, left: '39%', top: '33%', size: 'w-7 h-7' },
  { id: 5, left: '53%', top: '38%', size: 'w-7 h-7' },
  { id: 6, left: '73%', top: '32%', size: 'w-7 h-7' },
  { id: 7, left: '16%', top: '44%', size: 'w-7 h-7' },
  { id: 8, left: '81%', top: '43%', size: 'w-7 h-7' },
  { id: 9, left: '26%', top: '50%', size: 'w-7 h-7' },
  { id: 10, left: '35%', top: '57%', size: 'w-6 h-6' },
  { id: 11, left: '69%', top: '53%', size: 'w-7 h-7' },
  { id: 12, left: '20%', top: '57%', size: 'w-6 h-6' },
  { id: 13, left: '84%', top: '55%', size: 'w-6 h-6' },
  { id: 14, left: '75%', top: '59%', size: 'w-6 h-6' },
];

const STORAGE_KEY = 'apple_farm_tree_harvested_apples';

const getStoredHarvests = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [id, regrowAt] of Object.entries(parsed)) {
      if (Number(regrowAt) > now) {
        valid[id] = Number(regrowAt);
      }
    }
    return valid;
  } catch (e) {
    return {};
  }
};

export default function HomePage({ 
  user = { apples: 0, diamonds: 0.0, name: 'Farmer', level: 1, avatar: 'avatar-1' }, 
  onHarvest, 
  onNavigate, 
  onWithdraw, 
  onOpenProfile,
  onShowPopup
}) {
  const [harvestedApples, setHarvestedApples] = useState(() => {
    const stored = getStoredHarvests();
    const initial = {};
    for (const id of Object.keys(stored)) {
      initial[Number(id)] = true;
    }
    return initial;
  });
  const [fallingApples, setFallingApples] = useState([]); // [{ id, left, top, size }]
  const [newlyGrownApples, setNewlyGrownApples] = useState(new Set());
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  const currentLevel = calculateLevel(user.apples || 0);
  const avatarImg = getAvatarSrc(user.avatar);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // পেজে ব্যাক আসলে বাকি সময়ের জন্য রিগ্রোথ টাইমার সক্রিয় রাখা
  useEffect(() => {
    const stored = getStoredHarvests();
    const now = Date.now();
    const timers = [];

    for (const [appleIdStr, regrowAt] of Object.entries(stored)) {
      const appleId = Number(appleIdStr);
      const remainingMs = Math.max(0, regrowAt - now);
      
      const timer = setTimeout(() => {
        setHarvestedApples((prev) => {
          const next = { ...prev };
          delete next[appleId];
          return next;
        });

        try {
          const current = getStoredHarvests();
          delete current[appleId];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch (e) {}

        setNewlyGrownApples((prev) => new Set(prev).add(appleId));
        setTimeout(() => {
          setNewlyGrownApples((prev) => {
            const next = new Set(prev);
            next.delete(appleId);
            return next;
          });
        }, 1000);
      }, remainingMs);

      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // ব্যাকগ্রাউন্ডের খালি জায়গায় ট্যাপ করলে
  const handleTreeTap = () => {
    // যেকোনো একটি অ্যাভেইলেবল আপেল হার্ভেস্ট করার ট্রাই করা
    const availableApples = TREE_APPLES.filter(a => !harvestedApples[a.id]);
    if (availableApples.length > 0) {
      // র্যান্ডম অ্যাভেইলেবল আপেল হার্ভেস্ট
      const targetApple = availableApples[Math.floor(Math.random() * availableApples.length)];
      triggerAppleHarvest(targetApple);
    } else {
      // সব আপেল অলরেডি তোলা হয়ে গেলে নতুন আপেল না আসা পর্যন্ত কোনো পয়েন্ট বাড়বে না
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  // আপেল হার্ভেস্ট ফাংশন (ট্যাপ করলে ব্যালেন্স বাড়বে, আপেল পড়বে এবং ১০ সেকেন্ড পর আবার গজাবে - কোনো পপআপ ছাড়া)
  const triggerAppleHarvest = (apple) => {
    if (harvestedApples[apple.id]) return; // অলরেডি ঝরে গেছে

    // 🎵 রসালো আপেল হার্ভেস্ট সাউন্ড
    soundManager.playHarvestSound();

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // ব্যালেন্স বাড়ানো
    if (onHarvest) onHarvest();

    // ১. আপেলটিকে ঝরা অবস্থায় স্টেট ও লোকালস্টোরেজে সেভ করা (১০ সেকেন্ড পারসিস্টিং)
    setHarvestedApples((prev) => ({ ...prev, [apple.id]: true }));
    const regrowAt = Date.now() + 10000;
    try {
      const current = getStoredHarvests();
      current[apple.id] = regrowAt;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {}

    // ২. নিচে পড়ার ফলিং অ্যানিমেশন এলিমেন্ট তৈরি
    const fallId = Date.now() + Math.random();
    setFallingApples((prev) => [
      ...prev,
      { id: fallId, left: apple.left, top: apple.top, size: apple.size },
    ]);

    // ৩. ৮৫০ms পর ফলিং এলিমেন্ট রিমুভ
    setTimeout(() => {
      setFallingApples((prev) => prev.filter((item) => item.id !== fallId));
    }, 850);

    // ৪. ⏳ ঠিক ১০ সেকেন্ড (10,000ms) পর নতুন আপেল ফিরে আসবে
    setTimeout(() => {
      setHarvestedApples((prev) => {
        const next = { ...prev };
        delete next[apple.id];
        return next;
      });

      try {
        const current = getStoredHarvests();
        delete current[apple.id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch (e) {}

      // গ্রোইং পপ অ্যানিমেশন
      setNewlyGrownApples((prev) => new Set(prev).add(apple.id));
      setTimeout(() => {
        setNewlyGrownApples((prev) => {
          const next = new Set(prev);
          next.delete(apple.id);
          return next;
        });
      }, 1000);
    }, 10000);
  };

  // সরাসরি আপেলে ক্লিক করলে
  const handleAppleTap = (e, apple) => {
    e.stopPropagation();
    triggerAppleHarvest(apple);
  };

  return (
    <div 
      style={{ backgroundImage: `url(${homeBgImg})` }}
      className="relative w-full max-w-md mx-auto min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* 🍃 Farm Falling Leaves Animation */}
      <FallingLeaves count={10} />
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="pt-2 px-3 pb-2 z-20">
        
        {/* Custom Telegram Mini App Title Bar */}
        <CustomTitleBar title="Apple Farm" />
        
        {/* User Info & Diamond Counter */}
        <div className="flex items-center justify-between mb-3 px-1">
          {/* User Profile */}
          <div 
            onClick={() => {
              soundManager.playClickSound();
              if (onOpenProfile) onOpenProfile();
              else onNavigate?.('profile');
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img 
                src={avatarImg} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1a2f4c] leading-tight drop-shadow-sm max-w-[120px] truncate">{user.name || 'Farmer'}</h2>
              <span className="text-xs font-bold text-[#32527b]">Lv.{currentLevel}</span>
            </div>
          </div>

          {/* Right Area: Rank Trophy & Diamond Pill */}
          <div className="flex items-center gap-2">
            {/* Leaderboard / Rank Button */}
            <button 
              onClick={() => {
                soundManager.playClickSound();
                onNavigate?.('leaderboard');
              }}
              className="bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-sm border border-emerald-300 transition-all flex items-center justify-center"
            >
              <span className="leading-none">Rank</span>
            </button>

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
              <h1 className="text-2xl font-black text-[#12284c] tracking-tight">{(user.apples || 0).toLocaleString()}</h1>
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
            onClick={() => {
              soundManager.playClickSound();
              onNavigate?.('task', { taskTab: 'Daily' });
            }}
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
            <span className="text-[10px] font-bold text-gray-400">+500 Apples</span>
          </button>
        </div>

      </div>

      {/* ----------------- CENTER INTERACTIVE TAP AREA OVER BACKGROUND ----------------- */}
      <div 
        onClick={handleTreeTap}
        className="tree-interactive-area relative flex-1 flex flex-col items-center justify-center cursor-pointer active:brightness-105 transition-all overflow-hidden"
      >
        {/* 🍎 3D Glossy Apples on Tree Branches (Clickable + 10s Regrowth) */}
        <div className="absolute inset-0">
          {TREE_APPLES.map((apple) => {
            const isHarvested = harvestedApples[apple.id];
            const isNewlyGrown = newlyGrownApples.has(apple.id);

            // যদি অলরেডি ঝরে গিয়ে থাকে, তাহলে ডালে দেখাবে না
            if (isHarvested) return null;

            return (
              <div
                key={apple.id}
                onClick={(e) => handleAppleTap(e, apple)}
                style={{ left: apple.left, top: apple.top }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${apple.size} filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] cursor-pointer transition-transform duration-200 hover:scale-125 active:scale-90 ${
                  isNewlyGrown ? 'animate-apple-grow' : ''
                }`}
              >
                <img 
                  src={appleImg} 
                  alt="Apple" 
                  className="w-full h-full object-contain animate-apple-sway"
                  style={{ 
                    animationDuration: `${2.8 + (apple.id % 3) * 0.4}s`,
                    animationDelay: `${(apple.id * 0.4) % 2}s`
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 🍂 Falling Dropped Apples Animation (ঝরে পড়া আপেল) */}
        {fallingApples.map((apple) => (
          <div
            key={apple.id}
            style={{ left: apple.left, top: apple.top }}
            className={`absolute ${apple.size} pointer-events-none animate-apple-drop z-30 filter drop-shadow-lg`}
          >
            <img src={appleImg} alt="Falling Apple" className="w-full h-full object-contain" />
          </div>
        ))}

      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="home" onNavigate={onNavigate} />

    </div>
  );
}
